import express from "express"
import { getLeads , updateLead} from "../../db/KhambeeQuery.js"
const router = express.Router()


router.get('/',async (req,res)=>{
    try {
        const data = await getLeads(req.query)
        const success = {
            responseCode : 1 ,
            message : "Successfully fetched leads data",
            data
        }
        res.status(200).json(success);
    } catch (err) {
        const failure = {
            responseCode: 0,
            message : `Error in fetching leads data ${err.message}`
        }
        res.status(500).json(failure);
    }
})

router.put('/',async (req,res)=>{
    try {
        const message = await updateLead(req.body)
        const success = {
            responseCode : 1 ,
            message
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in updating lead status ${err.message}`
        }
        res.status(500).json(failure)
    }
})


export default router