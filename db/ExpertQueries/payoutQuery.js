import { DuplicateTransactionError, getDates , getcorrectTime} from "../../utils.js";
import { getConnection } from "../createConnection.js";


//-------  Global Values -------------------

const post_per_page = 10;
//------------------------------------------

export async function getPayouts(querydata){
    let [start_date , end_date] = getDates(querydata)
    const { tab , order , page } = querydata
    end_date = getcorrectTime(end_date);
    let payout_amount  = 0 , comissions = 0;
    try {
        let query , values ;
        if(tab =='PENDING'){
            query = 
                `SELECT *
                    FROM (
                        SELECT cte1.creator_id, ROUND(CAST(sum(amount) AS NUMERIC),3) as total_sales , ROUND(CAST(sum(comissions) AS NUMERIC),3) as comissions  , ROUND(CAST(sum(earnings) AS NUMERIC),5) as payout_amount , cte1.email  , cte1.name ,
                        (SELECT max(end_time) FROM booking WHERE user_id = cte1.creator_id AND payment_status = $1 AND status = $2 AND end_time <= $5) as last_sale_date
                            FROM (
                                SELECT c.id as creator_id , b.amount , b.amount * (b.commission_percentage / 100) as comissions  , b.amount - b.amount * (b.commission_percentage / 100) as earnings , b.end_time as date ,  b.payout_status , c.full_name as name , c.email as email
                                FROM booking AS b INNER JOIN creator AS c ON b.user_id = c.id 
                                WHERE b.payment_status = $1 AND b.status = $2 AND b.commission_percentage IS NOT NULL AND c.creator_platform = $3
                            ) as cte1 
                        WHERE payout_status = $4 AND cte1.date <= $5
                        GROUP BY cte1.creator_id , cte1.name , cte1.email
                    ) AS cte2
                 WHERE total_sales IS NOT NULL AND total_sales > 0
                 ORDER BY payout_amount ${order}`
            values = ["Successful",0,"Tpp","PENDING",end_date]
        }else{
            query = 
                   `SELECT creator_id, sum(payout_amount) as payout_amount , c.email as email , c.full_name as name , 
                    min(start_date) as start_date , max(end_date) as end_date , max(transaction_date) as payout_date ,
                    (SELECT id FROM tpp_payments WHERE creator_id = p.creator_id AND transaction_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT $3) as id , 
                    (SELECT comment FROM tpp_payments WHERE creator_id = p.creator_id AND transaction_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT $3) as comment,
                    (SELECT transaction_id FROM tpp_payments WHERE creator_id = p.creator_id AND transaction_date BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT $3) as transaction_id
                    FROM tpp_payments AS p INNER JOIN creator AS c ON p.creator_id = c.id
                    WHERE transaction_date BETWEEN $1 AND $2 
                    GROUP BY creator_id , c.full_name , c.email
                    ORDER BY payout_amount ${order}`
            values = [start_date , end_date ,1 ] 
        }
        const client = await getConnection()
        const { rows } = await client.query(query,values)
        const totalPayouts = rows 
        if(tab == 'PENDING'){
            totalPayouts.forEach((payout)=>{
                payout_amount+=parseFloat(payout.payout_amount)
                comissions+=parseFloat(payout.comissions)
            })
        }else{
            totalPayouts.forEach((payout)=>{
                payout_amount+=parseFloat(payout.payout_amount)
            })
        }
        let total_pages;
        const payouts = totalPayouts.slice(post_per_page*(page-1),post_per_page*page);
        if(totalPayouts.length % 10 == 0){
            total_pages = totalPayouts.length / 10;
        }else{
            total_pages = parseInt(totalPayouts.length / 10) + 1
        }
        // const response2 =  gettotalSales({ tab , start_date , end_date})
        // const response3 =  getPagesAndCount('ORDER',query,values)
                
        return  {
            payouts,
            comissions,
            payout_amount ,
            total_rows : payouts.length ,
            total_pages 
        }
    } catch (err) {
        throw err
    }

}

export async function updatePayout({ id , transaction_id , isChange , comment  }){
    try {
       const client = await getConnection()
       let rowcount;
       if(isChange){
           const { rows } = await client.query(`SELECT * FROM tpp_payments WHERE transaction_id = $1`,[transaction_id])
           if(rows.length > 0){
                throw new DuplicateTransactionError("Transaction id already exists")
           }else{
                const { rowCount } = await client.query(`UPDATE tpp_payments SET transaction_id = $1 , comment = $2 WHERE id = $3`,[transaction_id , comment , id])
                rowcount = rowCount
           }
       }else{
          const { rowCount } = await client.query(`UPDATE tpp_payments SET comment = $1 WHERE id = $2`,[comment , id])
          rowcount = rowCount
       }
       return rowcount
    } catch (err) {
       throw err
    }
}
