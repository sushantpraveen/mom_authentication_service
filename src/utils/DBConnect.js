const mongoose = require("mongoose")

async function DBConnect(){
    try{
        let MONGO_URI=process.env.MONGO_URI
        if(!MONGO_URI){
            throw new Error("MONGO_URI is not defined in environment variables")
        }
        await mongoose.connect(MONGO_URI)
        console.log("Mongo connected...")
    }catch(error){
        console.log(error)
    }
}

module.exports = DBConnect