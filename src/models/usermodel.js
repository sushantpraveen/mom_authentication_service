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
  publc_key: {
    type: String,
  },
  role:{
    type:String , 
    enum:["Admin" , "Store Manager", "Warehouse Manager" ,"Executive"]
  },  
  
});
const user = mongoose.model("user", userschema);
module.exports = user;
