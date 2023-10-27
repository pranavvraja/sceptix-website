const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
require('dotenv').config()
const app = express()
const {hashData,verifyHasedData} = require('./hashData')
const validationcheck = require('./validation')
const port = process.env.PORT
app.use(express.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(cors())

//DB connection
mongoose.connect(process.env.DATA_BASE_URL)

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
    console.log("database connected")
})
//Schema for DB
const userSchema = new mongoose.Schema({
    userName:String,
    email:String,
    otp:String,
    date:String,
    createdAT:Date,
    expiresAT:Date,
    verified:Boolean
})
//Model
const UserModel = mongoose.model('User',userSchema)

app.post('/api/reg',async (req,res)=>{
    const username = req.body.userName
    const email = req.body.email
    // const user = new UserModel({userName:username,email:email,date:new Date()})
    //function to check if the user already registered or not
    validationcheck.validationCheck(username,email,UserModel,res)


    
})

app.post('/api/otp',async (req,res)=>{
    try{
    const {email,otp} = req.body
    const validOTP = await verifyOtp({email,otp})
    if(validOTP){
        res.status(200).json({message:"OTP verified"})
    }
    else{
        res.status(400).json({message:"Invalid OTP"})
    }
    }
    catch(error){
        throw error
    }
})

// app.post('/api/verify',async(req,res)=>{
//     try{
//         let {email,otp} = req.body
//         const validOTP = await verifyOtp({email,otp})
//         res.status(200).json({valid:validOTP})

//     }
//     catch(error){
//        res.status(400).send(error.message)
//     }
// })

async function deleteOTP({email}){
    try{
        await UserModel.deleteOne({email})

    }
    catch(error){
        throw error
    }
}

async function verifyOtp ({email,otp}){
    try{
        if(!email && otp){
            throw Error("Provide values for email,otp")
        }
        // ensure otp record exists
        const matchOTPRecord = await UserModel.findOne({
            email,
        })

        if(!matchOTPRecord){
            throw Error ("No otp record found")
        }
        const {expiresAT} = matchOTPRecord;
        if(expiresAT < Date.now()){
            await UserModel.deleteOne({email})
            throw Error("OTP expired")

        }
        // not expired

        const hashedOtp = matchOTPRecord.otp;
        const validOtp = await verifyHasedData(otp,hashedOtp);
        return validOtp
    }
    catch(error){
        throw error
    }


 }




app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
})