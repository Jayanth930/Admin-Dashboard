import express from "express"
import { getAnalytics , getstartedregistrationAccounts , getcompletedAccounts , getcompletedProfiles } from "../../db/ExpertQueries/analyticsQuery.js"
const router = express.Router()

router.get('/',async (req,res)=>{
    const filteroptions = req.query
    try {
        const metrics = await getAnalytics(filteroptions)
        const success = {
            responseCode : 1 ,
            message : "Successfully fetched Metrics",
            metrics
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in fetching metrics ${err.message}`
        }
        res.status(500).json(failure)
    }
})


router.get('/startedregistration',async (req,res)=>{
    const query = req.query
    try {
        const data = await getstartedregistrationAccounts(query)
        const success = {
            responseCode : 1 ,
            message : "Successfully fetched details",
            data
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in fetching details ${err.message}`
        }
        res.status(500).json(failure)
    }
})

router.get('/completedaccountcreation',async (req,res)=>{
    const query = req.query
    try {
        const data = await getcompletedAccounts(query)
        const success = {
            responseCode : 1,
            message : "Successfully fetched complted_account_creation creators",
            data
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in fetching completed_accounts ${err.message}`
        }
        res.status(500).json(failure)
    }
})

router.get('/completedprofiles',async (req,res)=>{
    const query = req.query
    try {
        const data = await getcompletedProfiles(query)
        const success = {
            responseCode : 1 ,
            message : "Successfully fetched completed_profiles details",
            data
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in fetching completed_profiles details ${err.message}`
        }
        res.status(500).json(failure)
    }
})


export default router