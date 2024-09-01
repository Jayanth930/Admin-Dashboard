import { getDates } from "../../utils.js"
import { gettotalKhambeeSales , getPagesAndCount } from "../utilsQuery.js"
import { getConnection } from "../createConnection.js";

//-------  Global Values -------------------
const post_per_page = 10;
//------------------------------------------
export async function getAnalytics(query){
    const [start_date , end_date] = getDates(query)
    try {
        const client = await getConnection()
        const response1 = client.query(`SELECT count(*) as started_registration FROM creator WHERE status in ($1 , $2) AND created_at BETWEEN $3 AND $4 AND creator_platform = $5`,["Pending","Verified",start_date,end_date,"CreatorX"])
        const response2 = client.query(`SELECT COUNT(*) as completed_account_creation FROM creator WHERE status = $1 AND created_at BETWEEN $2 AND $3 AND creator_platform = $4`,["Active",start_date,end_date,"CreatorX"])
        const response3 = client.query(`SELECT count(*) as pro_account FROM creator WHERE status = $1 AND created_at BETWEEN $2 AND $3 AND creator_platform = $4`,["Authorized",start_date,end_date,"CreatorX"])
        const response4 = client.query(`SELECT COUNT(DISTINCT(creator_id)) as distinct_creators FROM course_purchase_details WHERE created_at BETWEEN $1 AND $2`,[start_date,end_date]);
        const response5 = client.query(`SELECT sum(payout_amount) as paid_amount FROM payments WHERE transaction_date BETWEEN $1 AND $2`,[start_date , end_date])
        const response6 = client.query(`SELECT COUNT(*) as drop_outs FROM creator WHERE created_at BETWEEN $1 AND $2 AND (email IS NULL OR phone_no IS NULL) AND creator_platform = $3`,[start_date,end_date,"CreatorX"])
        const response7 = gettotalKhambeeSales({start_date , end_date})
        const responses = await Promise.all([response1,response2,response3,response4,response5,response6,response7])
        const {total_sales , comissions , earnings , sales_count} = responses[6]
        const metrics = {
            start_registration : responses[0].rows.length > 0 ? responses[0].rows[0].started_registration : 0 ,
            completed_account_creation : responses[1].rows.length > 0 ? responses[1].rows[0].completed_account_creation : 0 ,
            pro_account : responses[2].rows.length > 0 ? responses[2].rows[0].pro_account : 0 ,
            distinct_creators : responses[3].rows.length > 0 ? responses[3].rows[0].distinct_creators : 0 ,
            total_sales : total_sales ? total_sales : 0 , 
            comissions ,
            earnings ,
            paid_amount : responses[4].rows[0].paid_amount != null ?  responses[4].rows[0].paid_amount : 0,
            no_of_sales : sales_count ,
            drop_outs : responses[5].rows[0].drop_outs
        }
        return metrics
    } catch (err) {
        throw new Error(err.message)
    }
}


export async function getstartedregistrationAccounts(querydata){
    const [start_date,end_date] = getDates(querydata)
    const { status , order , page  }  = querydata
    try {
        const client = await getConnection()
        let query , values;
        if(status != "ALL"){
            query = `SELECT id as creator_id , full_name as name , email , status as account_status , created_at  , phone_no
                     FROM creator 
                     WHERE created_at BETWEEN $1 and $2  AND status = $3 AND creator_platform = $4 
                     ORDER BY created_at ${order}
                     OFFSET $5 LIMIT $6`
            values = [start_date,end_date,status,"CreatorX",post_per_page*(page-1),post_per_page]
        }else{
            query = `SELECT id as creator_id , full_name as name , email , status as account_status , created_at , phone_no
                     FROM creator 
                     WHERE created_at BETWEEN $1 AND $2 AND status in ($3,$4) AND creator_platform = $5
                     ORDER BY created_at ${order}
                     OFFSET $6 LIMIT $7`
            values = [start_date,end_date,"Pending","Verified","CreatorX",post_per_page*(page-1),post_per_page]
        }
        const { rows } = await client.query(query,values);
        const [count , pages] = await  getPagesAndCount('ORDER',query,values)
        return {
            started_registration : rows ,
            total_pages : pages
        }
    } catch (err) {
        throw new Error(err.message)
    }
}


export async function getcompletedAccounts(querydata){
    const [start_date,end_date] = getDates(querydata)
    const { order , page } = querydata
    const query = `SELECT id as creator_id , full_name as name , email , status as account_status , created_at , phone_no
                   FROM creator 
                   WHERE created_at BETWEEN $1 AND $2 AND status = $3 AND creator_platform = $4
                   ORDER BY created_at ${order}
                   OFFSET $5 LIMIT $6`
    const values = [start_date,end_date,"Active","CreatorX",post_per_page*(page-1),post_per_page]
    try{
        const client = await getConnection()
        const { rows } = await client.query(query,values)
        const [count , pages] = await  getPagesAndCount('ORDER',query,values)
        return {
            completed_accounts : rows ,
            total_pages : pages
        }
    }catch(err){
        throw new Error(err.message)
    }
}


export async function getproAccounts(querydata){
    const [start_date,end_date] = getDates(querydata)
    const { order , page } = querydata
    const query = ` SELECT id as creator_id , full_name as name , email , status as account_status , created_at , account_upgraded_date as upgraded_on , phone_no
                    FROM creator 
                    WHERE status = $1 AND created_at BETWEEN $2 AND $3 AND creator_platform = $4
                    ORDER BY created_at ${order}
                    OFFSET $5 LIMIT $6`
    const values = ["Authorized",start_date,end_date,"CreatorX",post_per_page*(page-1),post_per_page]
    try {
        const client = await getConnection()
        const { rows } = await client.query(query,values)
        const [count , pages] = await  getPagesAndCount('ORDER',query,values)
        return {
            pro_accounts : rows ,
            total_pages : pages
        }
    } catch (err) {
        throw new Error(err.message)
    }
}
