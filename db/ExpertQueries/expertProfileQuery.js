import { getPagesAndCount } from "../utilsQuery.js"
import { getConnection } from "../createConnection.js";
import { getDates , DuplicateTransactionError, getDate, getcurrentTime, getcorrectTime } from "../../utils.js"
import {v4 as uuid} from "uuid"
import axios from "axios";
import { config } from "dotenv";
config()
//-------  Global Values -------------------

const post_per_page = 10;
const backendurl = process.env.CREATORX_BACKEND_URL
//------------------------------------------

export async function getExpertSales({creator_id , start_date ,end_date}){
    try {
        const query = 
            `SELECT ROUND(CAST(sum(amount) AS NUMERIC),3) as total_sales  , ROUND(CAST(sum(comissions) AS NUMERIC),3) as comissions , ROUND(CAST(sum(earnings) AS NUMERIC),3) as earnings , count(*) as sales_count
                 FROM (
                        SELECT user_id as creator_id , amount , amount * (commission_percentage / 100) AS comissions , amount - (amount * (commission_percentage / 100)) AS earnings , modified_at
                        FROM booking 
                        WHERE payment_status = $2 AND status = $3 AND commission_percentage IS NOT NULL
                  ) as total_sales
             WHERE creator_id = $1  AND modified_at BETWEEN $4 AND $5`
        const values = [creator_id,"Successful",0,start_date,end_date]
        const client = await getConnection()
        const { rows } = await client.query(query , values)
        // console.log(total_sales,comissions,earnings)
        return rows[0];
    } catch (err) {
        throw new Error(`Error in calculating total_sales ${err.message}`)
    }
}



export async function getExpert(creator_id){
    try {
        //name , email , createdon , status , last payout , website link , 
        const client = await getConnection()
        const response1 =  client.query(`select full_name as creator_name , email , created_at , CONCAT($2::TEXT,public_url) as website_link , status , avatar_id as profile_image , phone_no , commission_percentage , payout_plans as payout_type from creator where id = $1`,[creator_id,process.env.EXPERT_PROFILE_LINK])
        const response2 =  client.query(`select name as account_name , account_number , ifsc_code , image_url as passbook  , verification_status from creator_bank_details where creator_id = $1`,[creator_id])
        const response3 =  client.query(`select max(transaction_date) as last_payout_date from tpp_payments where creator_id = $1`,[creator_id])
        
        const [start_date , end_date] = getDates({fromdate : '2000/01/01' , enddate : '5000/01/01'})
        const response4 =  getExpertSales({creator_id ,start_date , end_date})
        
        const results = await Promise.all([response1,response2,response3,response4])
        
        const basicdetails = results[0].rows[0] , accountdetals = results[1].rows[0] , { last_payout_date } = results[2].rows[0];
        const { total_sales , comissions , earnings } = results[3]
        const object =  {
            ...basicdetails, 
            ...accountdetals ,
            last_payout_date,
            total_sales: parseInt(total_sales),
            comissions,
            earnings 
        }

        return object
    } catch (err) {
        throw err
    }
}

export async function getLastTransactionDate(creator_id){
    try {
        const client = await getConnection()
        const { rows } = await client.query(`SELECT max(end_date) as last_transaction_date FROM tpp_payments WHERE creator_id = $1`,[creator_id])
        if(rows[0].last_transaction_date != null){
            return  rows[0].last_transaction_date
        }else{
            const { rows } = await client.query(`SELECT created_at as last_transaction_date FROM creator WHERE id = $1`,[creator_id])
            return rows[0].last_transaction_date
        } 
    } catch (err) {
        throw err
    }
}

export async function getupcomingPayment({creator_id , enddate}){
    
    try {
        const client = await getConnection()
        let [start_date , end_date] = getDates({fromdate : enddate , enddate})
        end_date = getcorrectTime(end_date)
        const query = 
                `SELECT ROUND(CAST(sum(amount) AS NUMERIC),3) as total_sales , ROUND(CAST(sum(comissions) AS NUMERIC),3) as comissions , ROUND(CAST(sum(earnings) AS NUMERIC),3) as earnings
                    FROM (
                        SELECT user_id as creator_id , amount , amount * (commission_percentage / 100) AS comissions , amount - (amount * (commission_percentage / 100)) AS earnings , payout_status , end_time as date
                        FROM booking 
                        WHERE payment_status = $2 AND status = $3 AND commission_percentage IS NOT NULL
                    ) as cte1
                WHERE creator_id = $1 AND payout_status = $4 AND date <= $5`
        const values = [creator_id,"Successful",0,"PENDING",end_date]
        const { rows } = await client.query(query,values);
        const { earnings } = rows[0]
        const response1 = await client.query(`SELECT max(end_time) as last_sale_date FROM booking WHERE user_id = $1 AND payment_status = $2 AND status = $3 AND end_time <= $4`,[creator_id,"Successful",0,end_date]);
        if(earnings != null && earnings > 0){
            return {
                earnings , 
                last_sale_date : response1.rows[0].last_sale_date
            }
        }
        return null;
    } catch (err) {
        throw err
    }
}


export async function makePayment(data){
    const client = await getConnection()
    try {
        const {creator_id , payout_amount , transaction_id , comment , payout_date , fromdate , enddate } = data
        const { rows } = await client.query(`SELECT * FROM tpp_payments WHERE transaction_id = $1`,[transaction_id])
        if(rows.length > 0){
            throw new DuplicateTransactionError("Transaction id already exists")
        }
        let [start_date , end_date] = getDates({fromdate , enddate})
        const transaction_date = getDate(payout_date)
        const currTime = getcurrentTime()
        end_date = getcorrectTime(end_date)
        await client.query('BEGIN')
            const { rowCount } = await client.query(`INSERT INTO tpp_payments(id , creator_id , payout_amount , transaction_id , transaction_date , start_date , end_date , comment , created_at)  VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[uuid() , creator_id , payout_amount , transaction_id , transaction_date , start_date , end_date , comment , currTime])
            await client.query(`UPDATE booking SET payout_status = $1 WHERE user_id = $2 AND end_time <= $3`,["COMPLETED",creator_id,end_date])
        await client.query('COMMIT')
        return rowCount
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    }
}


export async function getpaymentHistory(querydata){
    const [start_date , end_date] = getDates(querydata)
    const { page  , creator_id } = querydata
    try {   
           const client = await getConnection()
           const query = 
                    `SELECT payout_amount , transaction_id , transaction_date  , $4 as status  , comment , start_date , end_date
                     FROM tpp_payments
                     WHERE creator_id = $1 AND transaction_date BETWEEN $2 AND $3
                     ORDER BY created_at DESC
                     OFFSET $5 LIMIT $6`
            const values = [creator_id,start_date,end_date,"COMPLETED",post_per_page*(page-1),post_per_page]
            const { rows } = await client.query(query,values)
            const [total_rows , total_pages] = await getPagesAndCount('ORDER',query,values)
            return {
               paymenthistory : rows,
               total_pages,
               total_rows
            }
    } catch (err) {
        throw err
    }
}

export async function updateComissionPercentage({ creator_id , comission_percentage }){
    try {
        const client = await getConnection()
        const { rowCount } = await client.query(`UPDATE creator SET commission_percentage = $1 WHERE id = $2`,[comission_percentage , creator_id])
        if(rowCount <= 0 ) {
            throw new Error("Error in updating comission percentage")
        }
    } catch (err) {
        throw err
    }
}

export async function getsalesDashboard(querydata){
    const [start_date,end_date] = getDates(querydata)
    const { order , creator_id , page  } = querydata
    // Now I can also use payout_status in tables to say whether its Credited or not.
    const query = `SELECT *
                    FROM (
                            SELECT user_id as booking , name as user_name , modified_at as date , 'Booking' as service , ROUND(CAST(amount AS NUMERIC),3) as sale_amount , ROUND(CAST(amount * (commission_percentage / 100) AS NUMERIC), 3) AS commissions , ROUND(CAST(amount - (amount * (commission_percentage / 100)) AS NUMERIC),3) AS earnings ,
                            CASE 
                                WHEN status = $3 THEN 'Refunded' 
                                WHEN payout_status = $4 THEN 'Credited'
                                WHEN status = $5 THEN 'Paid'
                                ELSE 'Something'
                            END as status
                            FROM booking 
                            WHERE user_id = $1 AND modified_at BETWEEN $6 and $7 AND payment_status = $2
                    ) AS result
                    ORDER BY date ${order}
                    OFFSET $8 LIMIT $9`
    try {
        const values = [creator_id,"Successful",1,"COMPLETED",0,start_date,end_date,post_per_page*(page-1),post_per_page]
        const client = await getConnection()
        const results = await Promise.all([ client.query(query,values) , getExpertSales({creator_id , start_date , end_date}) , getPagesAndCount('ORDER',query,values)])
        const sales = results[0].rows;
        const {total_sales , comissions , earnings } = results[1];        
        const [total_rows , total_pages ] = results[2]
        return {
            total_sales , comissions , earnings , 
            sales , 
            total_rows , total_pages
        }
        //   calculate sales from the sales array 
        // let total_sales  = 0.0, total_comissions=0.0 ,total_earnings =0.0,total_pages=0;
        // sales.forEach(sale => {
        //     if(sale.status !== "Refunded"){
        //         total_sales+=parseFloat(sale.sale_amount);
        //         total_comissions+=parseFloat(sale.comissions)
        //         total_earnings+=parseFloat(sale.earnings)
        //     }
        // });
        // if(sales.length % 10 === 0){
        //     total_pages = sales.length;
        // }else{
        //     total_pages = parseInt(sales.length / 10 ) + 1;
        // }
        // return {
        //     total_sales , comissions : total_comissions , earnings : total_earnings ,
        //     sales : sales.slice(post_per_page*(page-1),post_per_page*page) ,
        //     total_rows , total_pages
        // }
        
    } catch (err) {
        throw err
    }
}

export async function getbookingsDashboard(querydata){
    const [start_date,end_date] = getDates(querydata)
    const { order , creator_id , page , status } = querydata
    const currTime = new Date(getcurrentTime().getTime() + 5.5*60*60*1000) // production
    // Now I can also use payout_status in tables to say whether its Credited or not.
    let query , values;
    if(status === "UPCOMING"){
        query = `SELECT *
                    FROM (
                        SELECT booking_id as booking , name as user_name , email_id as email , 'Booking' as service , amount as sale_amount , ROUND(CAST(amount * (commission_percentage / 100) AS NUMERIC),3) AS commissions , start_time as date,
                            CASE 
                                WHEN payout_status = $3 THEN 'Credited'
                                ELSE 'Paid'
                            END as status
                        FROM booking 
                        WHERE user_id = $1 AND payment_status = $2 AND status = $4 AND start_time >= $5 
                    ) AS result
             ORDER BY date ${order}
             OFFSET $6 LIMIT $7`
        values = [creator_id,"Successful","COMPLETED",0,currTime,post_per_page*(page-1),post_per_page]
    }else if(status === "PAST"){
        query = `SELECT *
                    FROM (
                        SELECT booking_id as booking , name as user_name , email_id as email , 'Booking' as service , amount as sale_amount , ROUND(CAST(amount * (commission_percentage / 100) AS NUMERIC),3) AS commissions , end_time as date , 
                            CASE 
                                WHEN status = $3 THEN 'Refunded' 
                                WHEN payout_status = $4 THEN 'Credited'
                                WHEN status = $5 THEN 'Paid'
                                ELSE 'Something'
                            END as status
                        FROM booking 
                        WHERE user_id = $1 AND payment_status = $2 AND end_time <= $6 AND end_time BETWEEN $7 AND $8 
                    ) AS result
             ORDER BY date ${order}
             OFFSET $9 LIMIT $10`
        values = [creator_id,"Successful",1,"COMPLETED",0,currTime,start_date,end_date,post_per_page*(page-1),post_per_page]
    }else if(status === "CANCELLED"){
        query = `SELECT *
                    FROM (
                        SELECT booking_id as booking , name as user_name , email_id as email , 'Booking' as service , amount as sale_amount , ROUND(CAST(amount * (commission_percentage / 100) AS NUMERIC),3) AS commissions , start_time as date ,
                            CASE 
                                WHEN status = $3 THEN 'Refunded' 
                                WHEN payout_status = $4 THEN 'Credited'
                                WHEN status = $5 THEN 'Paid'
                                ELSE 'Something'
                            END as status
                        FROM booking 
                        WHERE user_id = $1 AND payment_status = $2 AND start_time BETWEEN $6 AND $7 AND status = $3
                    ) AS result
             ORDER BY date ${order}
             OFFSET $8 LIMIT $9`
        values = [creator_id,"Successful",1,"COMPLETED",0,start_date,end_date,post_per_page*(page-1),post_per_page]
    }else{
        query = `SELECT *
                    FROM (
                        SELECT booking_id as booking , name as user_name , email_id as email , 'Booking' as service , amount as sale_amount , ROUND(CAST(amount * (commission_percentage / 100) AS NUMERIC),3) AS commissions , start_time as date ,
                            CASE 
                                WHEN status = $3 THEN 'Refunded' 
                                WHEN payout_status = $4 THEN 'Credited'
                                WHEN status = $5 THEN 'Paid'
                                ELSE 'Something'
                            END as status
                        FROM booking 
                        WHERE user_id = $1 AND payment_status = $2 AND start_time BETWEEN $6 AND $7
                    ) AS result
             ORDER BY date ${order}
             OFFSET $8 LIMIT $9`
        values = [creator_id,"Successful",1,"COMPLETED",0,start_date,end_date,post_per_page*(page-1),post_per_page]
    }
    try {
        const client = await getConnection()
        const results = await Promise.all([ client.query(query,values) , getPagesAndCount('ORDER',query,values)])
        const bookings = results[0].rows;
        const [total_rows , total_pages ] = results[1]
        return {
            bookings , 
            total_rows , total_pages
        }
    } catch (err) {
        throw err
    }
}


export async function updateBankverification({ creator_id , status , message }){
    try {
        let url
        if(message){
            url = `${backendurl}/creator/updateBankStatus?creatorId=${creator_id}&status=${status}&message=${message}`
        }else{
            url = `${backendurl}/creator/updateBankStatus?creatorId=${creator_id}&status=${status}`
        }
        const { data } = await axios.put(url)
        return data.message
    } catch (err) {
        throw err
    }
}
