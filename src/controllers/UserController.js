const user = require("../models/usermodel");
const { client } = require("../services/redisClient");
const transportMail = require("../utils/nodemailer");
const BaseController = require("./BaseController");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class UserController extends BaseController {
  constructor() {
    super();
    this.otp = null;
  }

  //create users
  async createuser(req, res) {
    try {
      console.log("this is running...");
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
      this.error(res, 500, "internal server error", err);
    }
  }

  //login users
  async loginuser(req, res) {
    const { email, password } = req.body;
    try {
      if (!email || !password) {
        this.error(res, 404, "All fields are required");
      }
      const existuser = await user.findOne({ email });
      if (!existuser) this.error(res, 404, "user not found");
      const ismatch = await bcrypt.compare(password, existuser.password);
      if (!ismatch) {
        this.error(res, 401, "Invalid password");
      }

      // const token = jwt.sign({ id: existuser._id }, process.env.SECRET_KEY, {
      //     expiresIn: "12h",
      // });

      // this.otp = Math.ceil(Math.random(100000, 999999) * 1000000);
      this.otp = Math.floor(100000 + Math.random() * 900000);

      await client.setEx(`${email}:otp`, 120, JSON.stringify(this.otp));
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "OTP for mompharmacy dashboard login",
        text: `Your OTP for login is ${this.otp}`,
      };
      transportMail.sendMail(mailOptions, (err, info) => {
        console.log("this is herer");
        if (err) {
          console.error("Error sending email:", err);
          return this.error(res, 500, "Unable to send email", err);
        }
        this.success(
          res,
          {
            email,
          },
          "OTP sent successfully"
        );
      });
    } catch (error) {
      this.error(res, 500, "Internal server error ", error);
    }
  }

  // Email verification
  async verify(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        this.error(res, 400, "Email and OTP fields are required");
      }

      const emailexisted = await user.findOne({ email });
      if (!emailexisted) {
        this.error(res, 404, "User not found");
      }

      const redisOtp = await client.get(`${email}:otp`);

      const parsedOtp = JSON.parse(redisOtp);

      // parse the redis
      // check the otp
      if (Number(parsedOtp) === Number(otp)) {
        //token generate
        const token = jwt.sign(
          { id: emailexisted._id },
          process.env.SECRET_KEY,
          { expiresIn: "12h" }
        );
        await client.setEx(
          `user:${token}`,
          43200,
          JSON.stringify({ emailexisted })
        );

        console.log("This is token", token);

        this.success(res, 200, "OTP verified successfully", { token });
      } else {
        this.error(res, 400, "Invalid OTP or email");
      }
    } catch (error) {
      console.error(" error:", error);
      this.error(res, 500, "Internal server error");
    }
  }

  //get all the users
  async getall(req, res) {
    try {
      const allusers = await user.find({});
      this.success(res, 400, { allusers });
    } catch (error) {
      this.error(res, 500, "internal server error", error);
    }
  }

  // delete user
  async delete(req, res) {
    const { id } = req.params;
    try {
      const deleteuser = await user.findByIdAndDelete(id);
      if (!deleteuser) {
        this.error(res, 404, "user not found");
      }
      this.error(res, 200, "user deleted successfully");
    } catch (error) {
      this.error(res, 500, "internal server error");
    }
  }
}

module.exports = UserController;
