import express  from "express";
import { validateAdmin } from "../db/utilsQuery.js"
const router = express.Router()

router.post('/',async (req,res)=>{
    const data = req.body;
    try {
        const response = await validateAdmin(data)
        res.status(200).json(response)
    } catch (error) {
        const failure = {
            responseCode : 0 ,
            message : `Error in validating credentials ${err.message}`
        }
        res.status(500).json(failure)
    }
})






export default router;