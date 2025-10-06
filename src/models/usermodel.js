const mongoose = require("mongoose");
const crypto = require("crypto");
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
  otp: {
    type: String,
  },
  role: {
    type: String,
    required: true,
    enum: ["Admin", "Store Manager", "Warehouse Manager", "Executive"],
  },

  publicKey: {
    type: Buffer,
  role:{
    type:String , 
     required:true,
    enum:["Admin" , "Store Manager", "Warehouse Manager" ,"Executive"],
  },   

  currentChallenge: {
    type: String,
  },
  counter: {
    type: Number,
    default: 0,
  },
  credentialID: {
    type: Buffer,
  },
  Status: {
    type: String,
    enum: ["InActive", "Active"],
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: Date,

 
});

//  create a instance for reset password
userschema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

  console.log("Hashed Token (saved in DB):", this.passwordResetToken);

  return resetToken;
};

const user = mongoose.model("Members", userschema);
module.exports = user;
