import express from "express"
import { getExperts , searchExpert } from "../../db/ExpertQueries/expertsQuery.js"
const router = express.Router()

router.get('/',async (req,res)=>{
    const query = req.query
    try {
        const data = await getExperts(query)
        const success = {
            responseCode : 1 ,
            message : `Successfully fetched creator details for page ${query.page}`,
            data
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in fetching creators details ${err.message}`
        }
        res.status(500).json(failure)
    }
})

// Get the creator on the basis on name 
router.get('/searchcreator',async(req,res)=>{
    const { name } = req.query
    try {
        const data = await searchExpert({name : name.toLowerCase()})
        const success = {
            responseCode : 1 ,
            message : `Successfully fetched creator details`,
            data
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in fetching creator ${err.message}`
        }
        res.status(500).json(failure)
    }
})




export default router