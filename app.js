import express from "express"
import cors from "cors"
import jwt from "jsonwebtoken"
import loginRouter from "./routes/loginRouter.js"
import khambeeRouter from "./routes/khambeeRouter.js"
import expertRouter from "./routes/expertRouter.js"
import { authenticateJsonToken } from "./utils.js"
import { config } from "dotenv"
config()
const app = express()
const port = process.env.PORT || 3503

app.use(cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept, Authorization"
}));


app.use(express.json())

// Public route
app.use('/login', loginRouter);

// Authentication middleware applied to all routes after
app.use(async (req,res,next)=>{
    try {
        await authenticateJsonToken(req,res,next)
    } catch (err) {
        const failure = {}
        let statuscode;
        if(err instanceof jwt.TokenExpiredError){
            statuscode = 401
            failure["responseCode"] = 2 ,
            failure["message"] = "Token is expired"
        }else if(err instanceof jwt.JsonWebTokenError){
            statuscode = 403
            failure["responseCode"] = 3 ,
            failure["message"] = "Invalid Token"
        }else{
            statuscode = 500
            failure["responseCode"] = 0 ,
            failure["message"] = `Error with server ${err.message}`
        }
        res.status(statuscode).json(failure)
    }
});

// Protected routes
app.use('/khambee',khambeeRouter)
app.use('/expert',expertRouter)


app.use((err,req,res,next)=>{
    const failure = {
        responseCode : 0 ,
        message : err.message
    }
    res.status(500).json(failure)
})


app.listen(port , ()=>{
    console.log(`server started on port ${port}`)
})