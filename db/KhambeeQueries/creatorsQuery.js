import { getPagesAndCount } from "../utilsQuery.js"
import { getConnection } from "../createConnection.js";
import { getDates  } from "../../utils.js"

//-------  Global Values -------------------

const post_per_page = 10;
//------------------------------------------

export async function getCreators(querydata){
    const [start_date , end_date] = getDates(querydata)
    const { status , order , page , bankstatus } =  querydata
    try {
        let query , values ;
        if(status !== "ALL" || bankstatus !== "ALL"){
            if(bankstatus !== "ALL" && status !== "ALL"){
                if(bankstatus === "Incomplete"){
                    query = `SELECT c.id as creator_id , c.full_name as name , c.email , c.created_at , c.status as account_status ,
                            (SELECT sum(payout_amount) FROM payments WHERE creator_id = c.id)  as payout_summary , 
                            (SELECT max(transaction_date) FROM payments WHERE creator_id = c.id) as last_payout_date , 
                            cbd.verification_status as bank_details , c.phone_no
                            FROM creator AS c LEFT JOIN creator_bank_details AS cbd ON c.id = cbd.creator_id
                            WHERE c.status = $1  AND  cbd.verification_status IS NULL AND c.created_at BETWEEN $2 AND $3 AND c.creator_platform = $4
                            GROUP BY c.id , cbd.verification_status
                            ORDER BY created_at ${order}
                            OFFSET $5 LIMIT $6`
                    values = [status,start_date,end_date,"CreatorX",post_per_page*(page-1),post_per_page]
                }else{
                    query = `SELECT c.id as creator_id , c.full_name as name , c.email , c.created_at , c.status as account_status ,
                            (SELECT sum(payout_amount) FROM payments WHERE creator_id = c.id)  as payout_summary , 
                            (SELECT max(transaction_date) FROM payments WHERE creator_id = c.id) as last_payout_date , 
                            cbd.verification_status as bank_details , c.phone_no
                            FROM creator AS c LEFT JOIN creator_bank_details AS cbd ON c.id = cbd.creator_id
                            WHERE c.status = $1 AND cbd.verification_status = $2 AND c.created_at BETWEEN $3 AND $4 AND c.creator_platform = $5
                            GROUP BY c.id , cbd.verification_status
                            ORDER BY created_at ${order}
                            OFFSET $6 LIMIT $7`
                    values = [status,bankstatus,start_date,end_date,"CreatorX",post_per_page*(page-1),post_per_page]
                }
            }else if(bankstatus !== "ALL"){
                if(bankstatus === "Incomplete"){
                    query =`SELECT c.id as creator_id , c.full_name as name , c.email , c.created_at , c.status as account_status ,
                            (SELECT sum(payout_amount) FROM payments WHERE creator_id = c.id)  as payout_summary , 
                            (SELECT max(transaction_date) FROM payments WHERE creator_id = c.id) as last_payout_date , 
                            cbd.verification_status as bank_details , c.phone_no
                            FROM creator AS c LEFT JOIN creator_bank_details AS cbd ON c.id = cbd.creator_id
                            WHERE cbd.verification_status IS NULL AND c.created_at BETWEEN $1 AND $2 AND c.creator_platform = $3
                            GROUP BY c.id , cbd.verification_status
                            ORDER BY created_at ${order}
                            OFFSET $4 LIMIT $5`
                    values = [start_date,end_date,"CreatorX",post_per_page*(page-1),post_per_page]
                }else{
                    query =`SELECT c.id as creator_id , c.full_name as name , c.email , c.created_at , c.status as account_status ,
                            (SELECT sum(payout_amount) FROM payments WHERE creator_id = c.id)  as payout_summary , 
                            (SELECT max(transaction_date) FROM payments WHERE creator_id = c.id) as last_payout_date , 
                            cbd.verification_status as bank_details , c.phone_no
                            FROM creator AS c LEFT JOIN creator_bank_details AS cbd ON c.id = cbd.creator_id
                            WHERE cbd.verification_status = $1 AND c.created_at BETWEEN $2 AND $3 AND c.creator_platform = $4
                            GROUP BY c.id , cbd.verification_status
                            ORDER BY created_at ${order}
                            OFFSET $5 LIMIT $6`
                    values = [bankstatus,start_date,end_date,"CreatorX",post_per_page*(page-1),post_per_page]
                } 
            }else{
                query = 
                    `SELECT c.id as creator_id , c.full_name as name , c.email , c.created_at , c.status as account_status ,
                    (SELECT sum(payout_amount) FROM payments WHERE creator_id = c.id)  as payout_summary , 
                    (SELECT max(transaction_date) FROM payments WHERE creator_id = c.id) as last_payout_date , 
                    cbd.verification_status as bank_details , c.phone_no
                    FROM creator AS c LEFT JOIN creator_bank_details AS cbd ON c.id = cbd.creator_id
                    WHERE status = $1 AND c.created_at BETWEEN $2 AND $3 AND c.creator_platform = $4
                    GROUP BY c.id , cbd.verification_status
                    ORDER BY created_at ${order}
                    OFFSET $5 LIMIT $6`
                values = [status,start_date,end_date,"CreatorX",post_per_page*(page-1),post_per_page]
            }
        }else{
            query = 
               `SELECT c.id as creator_id , c.full_name as name , c.email , c.created_at , c.status as account_status , c.phone_no , 
                (SELECT sum(payout_amount) FROM payments WHERE creator_id = c.id)  as payout_summary , 
                (SELECT max(transaction_date) FROM payments WHERE creator_id = c.id) as last_payout_date , 
                cbd.verification_status as bank_details , c.phone_no
                FROM creator AS c LEFT JOIN creator_bank_details AS cbd ON c.id = cbd.creator_id
                WHERE created_at BETWEEN $1 AND $2 AND c.creator_platform = $3
                GROUP BY c.id , cbd.verification_status
                ORDER BY created_at ${order}
                OFFSET $4 LIMIT $5`
            values = [start_date,end_date,"CreatorX",post_per_page*(page-1),post_per_page]
        }
        const client = await getConnection()
        const { rows } = await client.query(query,values)
        const [total_rows , total_pages]= await getPagesAndCount('ORDER',query,values)
        return {
            creators : rows , 
            total_rows,
            total_pages
        }
    } catch (err) {
        throw err
    }
}

export async function searchCreator(querydata){
    const {name} = querydata
    try {
        const query = 
                   `SELECT c.id as creator_id , c.full_name as name , c.email , c.created_at , c.status as account_status , c.phone_no , 
                    (SELECT sum(payout_amount) FROM payments WHERE creator_id = c.id)  as payout_summary , 
                    (SELECT max(transaction_date) FROM payments WHERE creator_id = c.id) as last_payout_date , 
                    cbd.verification_status as bank_details , c.phone_no
                    FROM creator AS c LEFT JOIN creator_bank_details AS cbd ON c.id = cbd.creator_id
                    WHERE LOWER(c.full_name) like $1 AND c.creator_platform = $2
                    GROUP BY c.id , cbd.verification_status
                    ORDER by full_name ASC`
        const values = [`%${name}%`,"CreatorX"]
        const client = await getConnection()
        const { rows } = await client.query(query,values); 
        const [total_rows , total_pages]= await getPagesAndCount('ORDER',query,values)
        return {
            creators : rows ,
            total_rows,
            total_pages
        }
    } catch (err) {
        throw err
    }
}
