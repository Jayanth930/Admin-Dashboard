import { getDates } from "../../utils.js";
import { getConnection } from "../createConnection.js";
import { getPagesAndCount } from "../utilsQuery.js"
import axios from "axios";


//-------  Global Values -------------------
const post_per_page = 10;
const backendurl = process.env.CREATORX_BACKEND_URL
//------------------------------------------

export async function getLeads(querydata){
    const { status , fromdate , enddate , page , order } = querydata
    const [start_date , end_date] = getDates({fromdate , enddate});
    let query , values;
    if(status == "ALL"){
        query = 
           `SELECT user_name as name , email_id as email , mobile_number , industry_name as industry , date_of_submission as date , lead_status as status
            FROM sales_lead
            WHERE date_of_submission BETWEEN $1 AND $2
            ORDER BY date_of_submission ${order}
            OFFSET $3 LIMIT $4`
        values = [start_date , end_date , post_per_page*(page-1),post_per_page];
    }else{
        query = 
           `SELECT user_name as name , email_id as email , mobile_number , industry_name as industry , date_of_submission as date , lead_status as status
            FROM sales_lead
            WHERE date_of_submission BETWEEN $1 AND $2 AND lead_status = $3
            ORDER BY date_of_submission ${order}
            OFFSET $4 LIMIT $5`
        values = [start_date , end_date , status , post_per_page*(page-1),post_per_page];
    }
    const client = await getConnection()
    const response1 =  client.query(query , values);
    const response2 = getPagesAndCount('ORDER',query,values)
    const results = await Promise.all([response1,response2])
    const  { rows } = results[0] , [total_rows , total_pages] = results[1]
    return {
        leads : rows , 
        total_rows,
        total_pages
    }
}

export async function updateLead({email , status}){
    try {
        const { data } = await axios.put(`${backendurl}/sales/updateLeadStatus?email=${email}&status=${status}`)
        if(data.responseCode != 1){
            throw new Error(data.message)
        }
        return data.message
    } catch (err) {
        throw err
    }
}