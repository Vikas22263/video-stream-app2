import express from "express"
import dotenv from "dotenv";
dotenv.config({path:"./.env"})
import connectDB from "./db/index.js";
import server from "./app.js"
const app=express()
const PORT=process.env.PORT
app.use(server)
connectDB()
.then(()=>{
    app.listen(PORT ,()=>{
        console.log(`serever is running ${PORT}`)
    })
}).catch((err)=>{
    console.log(err,"error in mongo connection")
})


