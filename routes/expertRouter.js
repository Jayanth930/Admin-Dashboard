import express from "express"

import expertsRouter from "./ExpertRoutes/expertsRouter.js"
import expertProfileRouter from "./ExpertRoutes/expertProfileRouter.js"
import payoutRouter from "./ExpertRoutes/payoutRouter.js"
import analyticsRouter from "./ExpertRoutes/analyticsRouter.js"
import settingsRouter from "./ExpertRoutes/settingsRouter.js"

const router = express.Router()


router.use('/creators', expertsRouter);
router.use('/creatorprofile', expertProfileRouter);
router.use('/analytics', analyticsRouter);
router.use('/payouts', payoutRouter);
router.use('/settings',settingsRouter)



export default router;