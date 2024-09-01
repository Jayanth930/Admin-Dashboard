import express from "express"
import { getPayouts , updatePayout } from "../../db/KhambeeQueries/payoutQuery.js"
import { DuplicateTransactionError } from "../../utils.js"
const router = express.Router()

router.get('/',async (req,res)=>{
    const query = req.query
    try {
        const data = await getPayouts(query)
        const success = {
            responseCode : 1 ,
            message : "Successfully fetched payouts",
            data
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in fecthing payouts ${err.message}`
        }
        res.status(500).json(failure)
    }
})

// Get the details of specific payout from payment_history
router.put('/update',async (req,res)=>{
    const data = req.body
    try {
        const rowcount = await updatePayout(data)
        const success = {
            responseCode : 1 ,
            message : "Successfully updated payout",
            rowcount
        }
        res.status(200).json(success)
    } catch (err) {
        let failure , status;
        if(err instanceof DuplicateTransactionError){
            failure = {
                responseCode : 2,
                message : "Transaction id already exists"
            }
            status = 200
        }else{
            failure = {
                responseCode : 0,
                message : `Error in updating payout details ${err.message}`
            }
            status = 500
        }
        res.status(status).json(failure)
    }
})







export default router;