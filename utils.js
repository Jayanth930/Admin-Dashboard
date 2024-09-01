import jwt  from "jsonwebtoken"
import { config } from "dotenv";
import { v4 as uuid } from "uuid";
config()

/* Testing.

export function getcurrentTime(){
    const utc_time = Date.now(); 
    return  new Date(utc_time + 5.5 * 60 * 60 * 1000)
}

export function getDate(date){ // date in string
    return new Date(new Date(date).getTime() + 9.5*60*60*1000)
}

export function getDateString(date){ // date : Date
    const currTime = new Date(date);
    const date_string = `${currTime.getUTCFullYear()}/${currTime.getUTCMonth()+1}/${currTime.getUTCDate()}`
    return date_string
}

export function getDates({fromdate , enddate}){ // 2024/01/01
    const modified_enddate  = enddate + '    23:59:59:999'
    const extra = 5.5 * 60 * 60 * 1000
    const start_date = new Date(new Date(fromdate).getTime() + extra)
    const end_date = new Date(new Date(modified_enddate).getTime() + extra)

    return [start_date,end_date]
}

export const getWeekRange = (date_string)=>{
    const currTime = new Date(new Date(date_string).getTime() + 5.5*60*60*1000)
    let daynumber = currTime.getDay()
    if(daynumber == 0){
       daynumber = 7
    }
    const weekstartdate = new Date(currTime)
    weekstartdate.setDate(currTime.getDate() - daynumber + 1) // To get week's monday
    weekstartdate.setUTCHours(0,0,0,0)
    const weekenddate = new Date(weekstartdate)
    weekenddate.setDate(weekstartdate.getDate() + 6)
    weekenddate.setUTCHours(23,59,59,999)
    return [weekstartdate , weekenddate]
} */

// Production
export function getcurrentTime(){
    const utc_time = Date.now(); 
    return new Date(utc_time)
}

export function getDate(date){ // input : date in string , output : date in Date
    const date_format =  new Date(new Date(date).getTime() + 3*60*60*1000)
    return date_format    
}

export function getDateString(date){ // date : Date
    const currTime = new Date(date);
    const date_string = `${currTime.getUTCFullYear()}/${currTime.getUTCMonth()+1}/${currTime.getUTCDate()}`
    return date_string
}


export function getDates({fromdate , enddate}){ // 2024/01/01
    const modified_enddate  = enddate + '    23:59:59:999'
    const start_date = new Date(new Date(fromdate).getTime())
    const end_date = new Date(new Date(modified_enddate).getTime())

    return [start_date,end_date]
}



export const getWeekRange = (date_string)=>{
    const currTime = new Date(date_string)
    let daynumber = currTime.getDay()
    if(daynumber == 0){
       daynumber = 7
    }
    const weekstartdate = new Date(currTime)
    weekstartdate.setDate(currTime.getDate() - daynumber + 1) // To get week's monday
    weekstartdate.setUTCHours(0,0,0,0)
    const weekenddate = new Date(weekstartdate)
    weekenddate.setDate(weekstartdate.getDate() + 6)
    weekenddate.setUTCHours(23,59,59,999)
    return [weekstartdate , weekenddate]
}


export const generateAccesstoken = async (payload)=>{
    try {
        return await jwt.sign(payload , process.env.SECRET , { expiresIn : '7d' })
    } catch (error) {
        throw new Error(error.message)
    }
}


export const authenticateJsonToken = async (req,res,next)=>{
    const authHeader  = req.headers['authorization']
    if(!authHeader) return res.sendStatus(401)
    const token = authHeader.trim().split(" ")[1]
    if(!token) return res.sendStatus(401)
        try {
            await jwt.verify(token , process.env.SECRET)
            next()
        } catch (error) {
            throw error
        }
    
}

export const getData = (data)=>{
    const currentTime = getcurrentTime()
    const { id , coupon_code ,  discount , expires_on , total_instances ,  availability , display_price } = data
    const valid_till = getDates({fromdate : expires_on , enddate : expires_on})[1]
    const amount = parseInt((parseFloat(discount) * display_price) / 100)
    if(id){
       return [ id , coupon_code , amount , discount , valid_till , total_instances , availability , currentTime , currentTime ]
    }
    return [ uuid() , coupon_code , amount , discount , valid_till , total_instances , availability , currentTime , currentTime ]
    
}

export const getcorrectTime = (end_date)=>{
    let correct_time = end_date;
    // Production
    const currTime = new Date(getcurrentTime().getTime() + 5.5*60*60*1000)  
    if(currTime.getUTCFullYear() === correct_time.getUTCFullYear() && currTime.getUTCMonth() == correct_time.getUTCMonth() && currTime.getUTCDate() == correct_time.getUTCDate()){
        correct_time = currTime
    }
    return correct_time;
}
//              ↑↑↑
// Testing  ↑↑↑↑↑↑↑↑↑↑↑
// const currTime = getcurrentTime()
export class DuplicateTransactionError extends Error{
    constructor(message){
        super(message)
    }
}

