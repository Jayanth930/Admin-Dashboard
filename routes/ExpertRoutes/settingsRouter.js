import express from "express"
import { getglobalParameter , updateUniversalComissionPercentage } from "../../db/ExpertQueries/settingsQuery.js"
const router = express.Router()

router.get('/' , async (req,res)=>{
    const { global_parameter } = req.query
    try {
        const data = await getglobalParameter(global_parameter)
        const success = {
            responseCode : 1 ,
            message : "Successfully fetched global Parameter",
            data
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in fetching global Parameter ${err.message}`
        }
        res.status(500).json(failure)
    }
})


router.put('/comission',async (req,res)=>{
    const { old_comission , new_comission } = req.body
    try {
        const rowcount = await updateUniversalComissionPercentage(old_comission,new_comission)
        const success = {
            responseCode : 1 ,
            message : "Successfully updated universal comission percentage",
            rowcount
        }
        res.status(200).json(success)
    } catch (err) {
        const failure = {
            responseCode : 0 ,
            message : `Error in updating universal comission percentage ${err.message}`
        }
        res.status(500).json(failure)
    }
})

// router.get('/price',async (req,res)=>{
//     try {
//         const subscription_details = await getPricedetails()
//         const success = {
//             responseCode : 1,
//             message : "Successfully fetched price details",
//             subscription_details
//         }
//         res.status(200).json(success)
//     } catch (err) {
//         const failure = {
//             responseCode : 0 ,
//             message : `Error in fetching price details ${err.message}`
//         }
//         res.status(500).json(failure)
//     }
// })

// router.put('/price',async (req,res)=>{
//     const { global_parameter } = req.query
//     const data = req.body
//     try {
//         const rowcount = await updatePricedetails(global_parameter,data)
//         const success = {
//             responseCode : 1 ,
//             message : "Successfully updated price details",
//             rowcount
//         }
//         res.status(200).json(success)
//     } catch (err) {
//         const failure = {
//             responseCode : 0 ,
//             message : `Error in updating price details ${err.message}`
//         }
//         res.status(500).json(failure)
//     }
// })

// router.put('/',async (req,res)=>{
//     const data = req.body
//     try {
//         const rowcount = await updateglobalParameter(data)
//         const success = {
//             responseCode : 1 ,
//             message : "Successfully updated global Parameter",
//             rowcount
//         }
//         res.status(200).json(success)
//     } catch (err) {
//         const failure = {
//             responseCode : 0 ,
//             message : `Error in updating global Parameter ${err.message}`
//         }
//         res.status(500).json(failure)
//     }

// })

// router.get('/coupons', async (req,res)=>{
//     try {
//         const coupons = await getCoupons()
//         const success = {
//             responseCode : 1 ,
//             message : "Successfully fetched coupons",
//             coupons
//         }
//         res.status(200).json(success)
//     } catch (error) {
//         const failure = {
//             responseCode : 0 ,
//             message : `Error in fetching coupons`
//         }
//         res.status(500).json(failure)
//     }
// })

// // This is used to check if this name could be used or not.
// router.get('/coupon/:coupon_code',async (req,res)=>{
//     const { coupon_code } = req.params
//     try {
//         const isValid = await searchCoupon(coupon_code)
//         const success = {
//             responseCode : 1 ,
//             message : "Successfully searched coupons",
//             isValid
//         }
//         res.status(200).json(success)
//     } catch (err) {
//         const failure = {
//             responseCode : 0 ,
//             message : `Error in fetching coupons ${err.message}`
//         }
//         res.status(500).json(failure)
//     }
// })

// router.post("/coupon",async (req,res)=>{
//     const data = req.body
//     try {
//         const rowcount = await createCoupon(data)
//         const success = {
//             responseCode : 1 ,
//             message : "Successfully created/updated coupon",
//             rowcount
//         }
//         res.status(200).json(success)
//     } catch (err) {
//         const failure = {
//             responseCode : 0 ,
//             message : `Error in creating coupon ${err.message}`
//         }
//         res.status(500).json(failure)
//     }
// })

// router.put('/coupon',async (req,res)=>{
//     const { id } = req.query
//     const data = req.body
//     try {
//         const rowcount = await updateCoupon(id , data)
//         const success = {
//             responseCode : 1 ,
//             message : "Successfully updated coupon details",
//             rowcount
//         }
//         res.status(200).json(success)
//     } catch (err) {
//         const failure = {
//             responseCode : 0 ,
//             message : `Error in updating coupon details ${err.message}`
//         }
//         res.status(500).json(failure)
//     }
// })



export default router