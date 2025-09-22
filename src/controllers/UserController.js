const { json } = require("express");
const user = require("../models/usermodel");
const BaseController = require("./BaseController");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class UserController extends BaseController {
  async createuser(req, res) {
      try {
        console.log("this is running...")
      const { fullname, email, pincode, mobileNumber, password } = req.body;

      if (!fullname || !email || !pincode || !mobileNumber || !password) {
        this.error(res, 404, "All fields are required");
      }
      const userexisted = await user.findOne({ email });
      if (userexisted) {
        this.error(res, 409, "User already existed");
      }
      const hashpassword = await bcrypt.hash(password, 10);

      const newuser = new user({
        fullname,
        email,
        pincode,
        mobileNumber,
        password: hashpassword,
      });
      await newuser.save();
      this.success(res, 200, "user created successfully", newuser);
    } catch (err) {
      this.error(res, 500, "internal server error",err);
    }
  }

  async loginuser(req, res) {
    const {email, password } = req.body;
    try {
      if (!email || !password) {
        this.error(res, 404, "All fields are required");
      }
      const existuser= await user.findOne({ email });
      if (!existuser) this.error(res, 404, "user not found");
      const ismatch = await bcrypt.compare(password, existuser.password);
      if (!ismatch) {
        this.error(res, 401, "Invalid password");
      }
      const SECRET_KEY = process.env.SECRET_KEY; 
      const token = jwt.sign({ id: existuser._id },SECRET_KEY, { expiresIn: "1h" });
       this.success(res, { token, user: existuser }, "User login successfully");

      console.log("this iss token")
    } catch (error) {
      this.error(res, 500, "Internal server error ",error);
    }
  }

  async getall(req, res) {
    try {
      const allusers = await user.find({});
      this.success(res, 400, json(allusers));
    } catch (error) {
      this.error(res, 500, "internal server error",error);
    }
  }
}

module.exports = UserController;
