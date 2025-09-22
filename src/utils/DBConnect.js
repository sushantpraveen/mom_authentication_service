const mongoose = require("mongoose")

async function DBConnect(){
    try{
        await mongoose.connect(process.env.MONGDB_URL)
        console.log("Mongo connected...")
    }catch(error){
        console.log(error)
    }
}

module.exports = DBConnect