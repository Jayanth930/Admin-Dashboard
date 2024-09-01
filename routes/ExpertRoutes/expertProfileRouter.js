import express from "express"
import {  getExpert , getupcomingPayment , makePayment  , getpaymentHistory , getsalesDashboard ,
     updateComissionPercentage  , getLastTransactionDate , updateBankverification , getbookingsDashboard } from "../../db/ExpertQueries/expertProfileQuery.js"
import { DuplicateTransactionError  } from "../../utils.js"
const router = express.Router()

// get creator profile details 

router.get("/",async (req,res)=>{
    const { creator_id } = req.query
    try {
        const creator = await getExpert(creator_id)
        const success = {
            responseCode : 1 ,
            message : "Successfully fetched creator details",
            creator
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in fetching creator details ${err.message}`
        }
        res.status(500).json(failure)
    }
})

router.get('/last_transaction_date',async (req,res)=>{
    const { creator_id } = req.query
    try {
        const last_transaction_date = await getLastTransactionDate(creator_id)
        const success = {
            responseCode : 1 ,
            message : "Successfully fetched Last Transaction date" ,
            last_transaction_date 
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in fetching Last Transaction date ${err.message}`
        }
        res.status(500).json(failure)
    }
})

router.put('/comission',async (req,res)=>{
    const data = req.body
    try {
        await updateComissionPercentage(data)
        const success = {
            responseCode : 1 ,
            message : "Succesfully updated comission percentage",
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in updating comission percentage ${err.message}`
        }
        res.status(500).json(failure)
    }
})

router.put('/bankverificationstatus',async (req,res)=>{
    try {
        const message = await updateBankverification(req.body)
        const success = {
            responseCode : 1 ,
            message
        }
        res.status(200).json(success);
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in updating bank details ${err.message}`
        }
        res.status(500).json(failure);
    }
})

router.get('/upcomingpayment',async (req,res)=>{
    try {
        const data = await getupcomingPayment(req.query)
        const success = {
            responseCode : 1 ,
            message : "Successfully fetched upcoming payment",
            data
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in updating/creating upcoming payment ${err.message}`
        }
        res.status(500).json(failure)
    }

})

router.post('/makepayment',async (req,res)=>{
    const data = req.body
    try {
        const rowcount = await makePayment(data)
        const success = {
            responseCode : 1 ,
            message : "Successfully made payment",
            rowcount
        }
        res.status(200).json(success)
    } catch (err) {
        let failure , status ;
        if(err instanceof DuplicateTransactionError ){
            failure = {
                responseCode : 2,
                message : "Transaction id already exists"
            }
            status = 200
        }else{
            failure = {
                responseCode : 0,
                message : `Error in make payment ${err.message}`
            }
            status = 500
        } 
        res.status(status).json(failure)
    }
})


router.get('/paymenthistory',async (req,res)=>{
    try {
        const data = await getpaymentHistory(req.query)
        const success = {
            responseCode : 1 ,
            message : "Successfully fetched paymenthistory",
            data
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in fetching payment history ${err.message}`
        }
        res.status(500).json(failure)
    }
})


router.get('/sales',async (req,res)=>{
    try {
        const data = await getsalesDashboard(req.query)
        const success = {
            responseCode : 1 ,
            message : "Successfully fetched sales",
            data
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in fetching total_sales ${err.message}`
        }
        res.status(500).json(failure)
    }
})

router.get('/bookings',async (req,res)=>{
    try {
        const data = await getbookingsDashboard(req.query)
        const success = {
            responseCode : 1 ,
            message : "Successfully fetched bookings",
            data
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in fetching bookings ${err.message}`
        }
        res.status(500).json(failure)
    }
})

export default router;