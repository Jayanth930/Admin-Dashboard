import express from "express"
import { getCreators , searchCreator } from "../../db/KhambeeQueries/creatorsQuery.js"
const router = express.Router()

router.get('/',async (req,res)=>{
    const query = req.query
    try {
        const data = await getCreators(query)
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
    const { name , page } = req.query
    try {
        const data = await searchCreator({name : name.toLowerCase() , page})
        const success = {
            responseCode : 1 ,
            message : `Successfully fetched creator details for page ${req.query.page}`,
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