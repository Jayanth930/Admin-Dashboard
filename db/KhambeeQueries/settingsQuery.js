import { DuplicateTransactionError, getcurrentTime, getData } from "../../utils.js"
import { getConnection } from "../createConnection.js"



export async function getglobalParameter(global_parameter){
    try {
        const client = await getConnection()
        const { rows } = await client.query(`SELECT * FROM master_config_table WHERE global_parameter = $1`,[global_parameter])
        return rows.length > 0 ? rows[0] : {}
    } catch (err) {
        throw err
    }
}

export async function updateglobalParameter({global_parameter , value }){
    try {
        const client = await getConnection()
        const currTime = getcurrentTime()
        const { rowCount } = await client.query(`UPDATE master_config_table SET value = $2 , modified_at = $3 WHERE global_parameter = $1`,[global_parameter , value ,currTime])
        return rowCount
    } catch (err) {
        throw err
    }
}

export async function getCoupons(){
    try{
        const client = await getConnection()
        const { rows } = await client.query(`SELECT * FROM creatorx_coupons ORDER BY created_at DESC`);
        return rows;
    }catch(err){
        throw err
    }
}

export async function searchCoupon(coupon_code){
    try {
        const client = await getConnection()
        const { rows } = await client.query(`SELECT * FROM creatorx_coupons WHERE coupon_code = $1`,[coupon_code])
        if(rows.length > 0) return false;
        return true;
    } catch (err) {
        throw err;
    }
}

export async function createCoupon(data){
    try {
        const client = await getConnection()
        const { rows } = await client.query(`SELECT display_price FROM master_config_table WHERE global_parameter = $1`,["SUBSCRIPTION AMOUNT INDIA"])
        data["display_price"] = rows[0].display_price
        const { coupon_code , isChange } = data 
        if(isChange){
            const { rows } = await client.query(`SELECT * FROM creatorx_coupons WHERE coupon_code = $1`,[coupon_code])
            if(rows.length > 0){
                throw new DuplicateTransactionError("Coupon code already exists")
            }
        }
        const { rowCount } = await client.query(
             `INSERT INTO creatorx_coupons(id , coupon_code , amount , discount , valid_till , total_instances ,  availability , created_at , modified_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
              ON CONFLICT(id)
              DO UPDATE SET coupon_code = $2 , amount = $3 , discount = $4 , valid_till = $5 , total_instances = $6 , availability = $7 , modified_at = $9`, getData(data))
        return rowCount
    } catch (err) {
        throw err
    }
}


export async function updateCoupon(id , data){
    const { column , value } = data
    try{
        const client = await getConnection()
        const { rowCount } = await client.query(`UPDATE creatorx_coupons SET ${column} = $1 , modified_at = $2 WHERE id = $3`,[value , getcurrentTime() , id])
        return rowCount
    }catch(err){
        throw err
    }
}

export async function updateUniversalComissionPercentage(old_comission , new_comission){
    const client = await getConnection()
    try {
        await client.query('BEGIN');
            const response1 = await client.query(`UPDATE master_config_table SET value = $1 WHERE global_parameter = $2`,[new_comission , "COMISSIONS"]);
            const response2 = await client.query(`UPDATE creator SET commission_percentage = $1 WHERE commission_percentage = $2 AND creator_platform = $3`,[new_comission , old_comission,"CreatorX"])
        if(response1.rowCount > 0 ){
            await client.query("COMMIT");
        }else{
            throw new Error("Error in updating universal comission percentage")
        }
        return;            
    } catch (err) {
        await client.query("ROLLBACK");
        throw err
    }
}

export async function getPricedetails(){
    try {
        const client = await getConnection()
        const { rows } =  await client.query(
            `SELECT  $3 as currency  , display_price , mrp_price , ROUND(((mrp_price - display_price) / mrp_price :: numeric)*100,2) as discount , modified_at FROM master_config_table WHERE global_parameter = $1
                    UNION 
             SELECT  $4 as currency  , display_price , mrp_price , ROUND(((mrp_price - display_price) / mrp_price :: numeric )*100,2) as discount , modified_at FROM master_config_table WHERE global_parameter = $2
            `,["SUBSCRIPTION AMOUNT INDIA" , "SUBSCRIPTION AMOUNT INTERNATIONAL" , "INDIA" , "INTERNATIONAL"])
        return rows;
    } catch (err) {
        throw err
    }
}

export async function updatePricedetails(global_parameter , data){
    const { display_price , mrp_price } = data
    const client = await getConnection()
    try {
        await client.query('BEGIN');
        const { rowCount } = await client.query(`UPDATE master_config_table SET display_price = $2 , mrp_price = $3 , modified_at = $4 WHERE global_parameter = $1`,[global_parameter,display_price,mrp_price,getcurrentTime()])
        if(global_parameter === "SUBSCRIPTION AMOUNT INDIA"){
            const response = await client.query(`UPDATE creatorx_coupons SET amount = (discount * ${display_price}) / 100`)
        }
        await client.query(`COMMIT`);
        return rowCount
    } catch (err) {
        await client.query('ROLLBACK');
        throw err
    }
}
