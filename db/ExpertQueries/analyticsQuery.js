import { getDates } from "../../utils.js"
import { getPagesAndCount, gettotalExpertSales } from "../utilsQuery.js"
import { getConnection } from "../createConnection.js";
import { config } from "dotenv";
import axios from "axios";
config()
//-------  Global Values -------------------
const post_per_page = 10;
const backendUrl = process.env.TPP_BACKEND_URL
//------------------------------------------
export async function getAnalytics(query){
    const [start_date , end_date] = getDates(query)
    const { fromdate , enddate } = query
    try {
        const client = await getConnection()
        const response1 = client.query(`SELECT COUNT(*) as profiles_completed FROM creator WHERE bank_details_added = $1 AND calendar_added = $1 AND creator_platform = $2 AND created_at BETWEEN $3 AND $4`,[true,"Tpp",start_date,end_date])
        const response2 = client.query(`SELECT COUNT(DISTINCT(user_id)) as experts_with_events FROM booking b INNER JOIN creator c ON b.user_id = c.id WHERE b.event_name NOT IN ($1,$2,$3,$4) AND c.creator_platform = $5 AND b.modified_at BETWEEN $6 AND $7`,["Product Consultation","Mock Interview ","Mentorship","Career Guidance","Tpp",start_date,end_date]);
        const response3 = client.query(`SELECT sum(payout_amount) as paid_amount FROM tpp_payments WHERE transaction_date BETWEEN $1 AND $2`,[start_date , end_date])
        const response4 = client.query(`SELECT COUNT(DISTINCT(id)) as expert_with_sales FROM creator WHERE creator_platform = $1 AND id IN (SELECT user_id FROM booking WHERE modified_at BETWEEN $2 AND $3)`,["Tpp",start_date,end_date])
        const response5 = gettotalExpertSales({start_date , end_date})
        const response6 = axios.get(`${backendUrl}/admin/dashboard/getAnalytics?fromDate=${fromdate}&endDate=${enddate}`)
        const responses = await Promise.all([response1,response2,response3,response4,response5,response6])
        const { data } = responses[5]
        const { startedAccountCreation , verifiedAccounts } = data
        const {total_sales ,  sales_count} = responses[4]
        const metrics = {
            started_account_creation : startedAccountCreation ,
            verified_accounts  : verifiedAccounts,
            profiles_completed : responses[0].rows.length > 0 ? responses[0].rows[0].profiles_completed : 0 ,
            experts_with_events : responses[1].rows.length > 0 ? responses[1].rows[0].experts_with_events : 0 ,
            paid_amount : responses[2].rows[0].paid_amount != null ?  responses[2].rows[0].paid_amount : 0,
            expert_with_sales : responses[3].rows.length > 0 ? responses[3].rows[0].expert_with_sales : 0 ,
            total_sales : total_sales ? total_sales : 0 , 
            no_of_sales : sales_count 
        }
        return metrics
    } catch (err) {
        throw err
    }
}


export async function getstartedregistrationAccounts(querydata){
    const { order , page , fromdate , enddate }  = querydata
    try {
        const { data } = await axios.get(`${backendUrl}/admin/dashboard/getAccountStarted/experts?filter=Pending&fromDate=${fromdate}&endDate=${enddate}&page=${page-1}&ord=${order}`)
        const { responseCode , experts , totalPages } = data
        if(responseCode == 1){
            return { experts , total_pages : totalPages}
        }else{
            throw new Error("Problem with Backend Call")
        }
    } catch (err) {
        throw err
    }
}


export async function getcompletedAccounts(querydata){
    const { order , page , fromdate , enddate }  = querydata
    try {
        const { data } = await axios.get(`${backendUrl}/admin/dashboard/getAccountStarted/experts?filter=Verified&fromDate=${fromdate}&endDate=${enddate}&page=${page-1}&ord=${order}`)
        const { responseCode , experts , totalPages} = data
        if(responseCode == 1){
            return { experts , total_pages : totalPages}
        }else{
            throw new Error("Problem with Backend Call")
        }
    } catch (err) {
        throw err
    }
}


export async function getcompletedProfiles(querydata){
    const [start_date,end_date] = getDates(querydata)
    const { order , page } = querydata
    const query = ` SELECT id as creator_id , full_name as name , email , status as account_status , created_at , account_upgraded_date as upgraded_on , cbd.verification_status as bankstatus , phone_no
                    FROM creator AS c INNER JOIN creator_bank_details AS cbd ON c.id = cbd.creator_id 
                    WHERE c.bank_details_added = $1 AND c.calendar_added = $1 AND c.created_at BETWEEN $2 AND $3 AND c.creator_platform = $4
                    ORDER BY c.created_at ${order}
                    OFFSET $5 LIMIT $6`
    const values = [true,start_date,end_date,"Tpp",post_per_page*(page-1),post_per_page]
    try {
        const client = await getConnection()
        const { rows } = await client.query(query,values)
        const [count , pages] = await  getPagesAndCount('ORDER',query,values)
        return {
            profiles_completed : rows ,
            total_pages : pages
        }
    } catch (err) {
        throw err
    }
}
