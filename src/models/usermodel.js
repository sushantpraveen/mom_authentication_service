const mongoose = require("mongoose");

const userschema = new mongoose.Schema({
  fullname: {
    type: String,
  },
  pincode: {
    type: Number,
  },
  mobileNumber: {
    type: Number,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  otp:{
    type:String,
  },
  role:{
    type:String , 
    enum:["Admin" , "Store Manager", "Warehouse Manager" ,"Executive"]
  },   
    publicKey: {
    type:Buffer,
  },
   currentChallenge:{
    type:String
  },
  counter:{
    type:Number,
    default:0
  },
  credentialID:{
    type:Buffer
  },
  Status:{
    type:String,
    enum:["InActive","Active"]
  }

  
});
const user = mongoose.model("Members", userschema);
module.exports = user;
