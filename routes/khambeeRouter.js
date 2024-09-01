import express from "express"

import creatorsRouter from "./KhambeeRoutes/creatorsRouter.js"
import payoutRouter from "./KhambeeRoutes/payoutRouter.js"
import creatorProfileRouter from "./KhambeeRoutes/creatorProfileRouter.js"
import analyticsRouter from "./KhambeeRoutes/analyticsRouter.js"
import settingsRouter from "./KhambeeRoutes/settingsRouter.js"
import leadRouter from "./KhambeeRoutes/leadRouter.js"

const router = express.Router()


router.use('/creatorprofile', creatorProfileRouter);
router.use('/creators', creatorsRouter);
router.use('/analytics', analyticsRouter);
router.use('/payouts', payoutRouter);
router.use('/settings',settingsRouter)
router.use('/leads',leadRouter)



export default router;