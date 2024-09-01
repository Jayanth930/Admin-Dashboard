import { getConnection } from "./createConnection.js";
import {  generateAccesstoken } from "../utils.js"

// const { Client } =  pg
// const client = new Client({
//     connectionString : process.env.CREATORX_DB_LINK ,
//     ssl : { 
//         rejectUnauthorized : false
//     }
// })

// client.connect().then(()=>console.log("connected to creatorX DB")).catch((err)=>console.log(`Error in connecting to db ${err.message}`))

//-------  Global Values -------------------

const post_per_page = 10;
const backendurl = process.env.CREATORX_BACKEND_URL
//------------------------------------------

// This query used to get total_pages
export async function getPagesAndCount(ending, query , values){
    const offsetIndex = query.lastIndexOf(ending);
    const subquery = query.substring(0, offsetIndex).trim();
    const placeholders = subquery.match(/\$\d+/g)
    if(values.length > 0){
        const length =  Math.max(...placeholders.map(ph => parseInt(ph.substring(1), 10)));
        values = values.slice(0,length)
    }
    try {
        const client = await getConnection()
        const { rows } = await client.query(subquery , values);
        const pages = parseInt(rows.length / 10 )
        const result = [rows.length]
        if(rows.length % 10 !== 0){
            result.push(pages + 1)
        }else{
            result.push(pages)
        }
        return result
    } catch (err) {
        throw new Error(`Error in calculating pages and count ${err.message}`)
    }
}

// async function getdetailsofCreators(creators , query , values){
//         const promises = []
//         creators.forEach((creator)=>{
//         //    const response1 = client.query(`SELECT max(transaction_date) as last_payout_date FROM payment_history WHERE creator_id = $1`,[creator.creator_id])
//            const response = client.query(`SELECT sum(payout_amount) as payout_summary , max(transaction_date) as last_payout_date FROM payments WHERE creator_id = $1`,[creator.creator_id])
//            promises.push(response);
//         })
//         const output = await Promise.all(promises)
//         const result = {}
//         result["creators"] = creators.map((creator , index)=>{
//             return {
//                 ...creator ,
//                 last_payout_date : output[index].rows.length > 0  ? output[index].rows[0].last_payout_date : null , // Last payout date 
//                 payout_summary : output[index].rows.length > 0  ? output[index].rows[0].payout_summary : 0
//             }
//         })
//         const [total_rows , total_pages]= await getPagesAndCount('ORDER',query,values)
//         result["total_rows"] = total_rows; result["total_pages"] = total_pages
//         return result;
// }

//------------------------------------------



export async function gettotalKhambeeSales({start_date , end_date}){
    const query =
            `SELECT ROUND(CAST(sum(amount) AS NUMERIC),3) as total_sales  , ROUND(CAST(sum(comissions) AS NUMERIC),3) as comissions , ROUND(CAST(sum(earnings) AS NUMERIC),3) as earnings , count(*) as sales_count
            FROM (
                    SELECT cpd.amount , cpd.amount * (cpd.commission_percentage / 100) AS comissions , cpd.amount - (cpd.amount * (cpd.commission_percentage / 100)) AS earnings , cpd.modified_at , c.creator_platform
                    FROM course_purchase_details AS cpd INNER JOIN creator AS c ON cpd.creator_id = c.id
                    WHERE (cpd.refund_status IS NULL OR cpd.refund_status != $1) AND cpd.payment_status = $2 
                        UNION 
                    SELECT b.amount , b.amount * (b.commission_percentage / 100) AS comissions , b.amount - (b.amount * (b.commission_percentage / 100)) AS earnings , b.modified_at , c.creator_platform
                    FROM booking AS b INNER JOIN creator AS c ON b.user_id = c.id
                    WHERE b.payment_status = $1 AND b.status = $3
                ) as cte1
            WHERE creator_platform = $4 AND modified_at BETWEEN $5 AND $6`
    const values =  ["Successful",2,0,"CreatorX",start_date,end_date]
    try {
        const client = await getConnection()
        const { rows } = await client.query(query , values)
        return rows[0]
    } catch (err) {
        throw err 
    }  
}

export async function gettotalExpertSales({start_date , end_date}){
    const query =
           `SELECT ROUND(CAST(sum(total_sales) AS NUMERIC),3) as total_sales  , ROUND(CAST(sum(comissions) AS NUMERIC),3) as comissions , ROUND(CAST(sum(earnings) AS NUMERIC),3) as earnings , count(*) as sales_count
            FROM (
                    SELECT b.amount as total_sales , b.amount * (b.commission_percentage / 100) AS comissions , b.amount - (b.amount * (b.commission_percentage / 100)) AS earnings , b.modified_at , c.creator_platform
                    FROM booking AS b INNER JOIN creator AS c ON b.user_id = c.id
                    WHERE payment_status = $1 AND b.status = $2
                ) as cte1
            WHERE creator_platform = $3 AND modified_at BETWEEN $4 AND $5`
    const values =  ["Successful",0,"Tpp",start_date,end_date]
    try {
        const client = await getConnection()
        const { rows } = await client.query(query , values)
        return rows[0]
    } catch (err) {
        throw err 
    }  
}


export async function validateAdmin({email , password}){
    try {
        const client = await getConnection()
        const { rows } = await client.query(`SELECT * FROM admin_credentials WHERE email=$1`,[email])
        if(rows.length == 0) return { resposneCode  : 2 , message : "Incorrect email" }
        else{
            const { rows } = await client.query(`SELECT * FROM admin_credentials WHERE email=$1 AND password = $2`,[email , password])
            if(rows.length == 0) return { resposneCode  : 3 , message : "Incorrect password" }
            else{
                const response = { resposneCode : 1  , message : "Successfully Authenticated" }
                const accessToken = await generateAccesstoken({ email })
                response['accessToken'] = accessToken
                return response
            }
        }
    } catch (err) {
        throw err
    }
}
