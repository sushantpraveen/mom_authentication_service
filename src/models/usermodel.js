const mongoose = require("mongoose");

const userschema = new mongoose.Schema({
  fullname: {
    type: String,
  },
  pincode: {
    type: Number,
  },
  mobilenumber: {
    type: Number,
  },
  emial: {
    type: String,
  },
  setpassword: {
    type: String,
  },
  confrimpassword: {
    type: String,
  },
});
const user = mongoose.model("user", userschema);
module.exports = user;
