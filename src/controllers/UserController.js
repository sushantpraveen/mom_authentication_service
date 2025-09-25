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

  // Request OTP for signup
async requestSignupOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return this.error(res, 400, "Email is required");

    // Check user does NOT exist
    const existUser = await user.findOne({ email });
    if (existUser) return this.error(res, 409, "User already exists");

    // Generate OTP
    this.otp = Math.floor(100000 + Math.random() * 900000);
    await client.setEx(`signup:${email}:otp`, 300, JSON.stringify(this.otp)); // 5 minutes

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP for mompharmacy signup",
      text: `Your OTP for signup is ${this.otp}`,
    };

    const info = await transportMail.sendMail(mailOptions);
    console.log("Signup OTP email sent:", info.response);

    return this.success(res, { email }, "OTP sent successfully");
  } catch (err) {
    console.error("Signup OTP error:", err);
    return this.error(res, 500, "Internal server error", err);
  }
}

// Verify OTP for signup
async verifySignupOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return this.error(res, 400, "Email and OTP are required");

    const redisOtp = await client.get(`signup:${email}:otp`);
    if (!redisOtp) return this.error(res, 400, "OTP expired or not found");

    const parsedOtp = JSON.parse(redisOtp);

    if (Number(parsedOtp) !== Number(otp)) {
      return this.error(res, 400, "Invalid OTP");
    }
    await client.setEx(`signup:${email}:verified`, 600, JSON.stringify(true)); // 10 minutes

    return this.success(res, 200, "Email OTP verified successfully");
  } catch (err) {
    console.error("Signup OTP verification error:", err);
    return this.error(res, 500, "Internal server error", err);
  }
}

// Create user AFTER email OTP verified
async createUserAfterOtp(req, res) {
  try {
    const { fullname, email, pincode, mobileNumber, password } = req.body;

    if (!fullname || !email || !pincode || !mobileNumber || !password) {
      return this.error(res, 400, "All fields are required");
    }
    const verified = await client.get(`signup:${email}:verified`);
    if (!verified) return this.error(res, 400, "Email OTP not verified");

    const userExists = await user.findOne({ email });
    if (userExists) return this.error(res, 409, "User already exists");

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = new user({
      fullname,
      email,
      pincode,
      mobileNumber,
      password: hashPassword,
    });

    await newUser.save();
    await client.del(`signup:${email}:otp`);
    await client.del(`signup:${email}:verified`);

    return this.success(res, 200, "User created successfully", newUser);
  } catch (err) {
    console.error("Create user after OTP error:", err);
    return this.error(res, 500, "Internal server error", err);
  }
}

// Invite user by sending signup link
async inviteUser(req, res) {
  try {
    const { fullname, email, role, mobileNumber } = req.body;

    if (!email || !role) {
      return this.error(res, 400, "Email and role are required");
    }

    const existUser = await user.findOne({ email });
    if (existUser) return this.error(res, 409, "User already exists");

    const token = jwt.sign(
      { email, role },
      process.env.SECRET_KEY,
      { expiresIn: "24h" }
    );

    const signupLink = `${process.env.FRONTEND_URL}/signup?token=${token}`;

    // Send invite mail
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Invitation to join Mompharmacy",
      html: `
        <p>Hello ${fullname || "there"},</p>
        <p>You have been invited to join <b>mompharmacy</b> as <b>${role}</b>.</p>
        <p>Please click the link below to complete your signup:</p>
        <a href="${signupLink}" target="_blank">${signupLink}</a>
        <p>This link will expire in 24 hours.</p>
      `,
    };

    await transportMail.sendMail(mailOptions);

    return this.success(res, 200, "Invitation sent successfully", { email });
  } catch (err) {
    console.error("Invite error:", err);
    return this.error(res, 500, "Internal server error", err);
  }
}

  // login users
async loginuser(req, res) {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return this.error(res, 404, "All fields are required");
    }

    const existuser = await user.findOne({ email });
    if (!existuser) return this.error(res, 404, "user not found");

    const ismatch = await bcrypt.compare(password, existuser.password);
    if (!ismatch) {
      return this.error(res, 401, "Invalid password");
    }

    // Generate OTP
    this.otp = Math.floor(100000 + Math.random() * 900000);
    await client.setEx(`${email}:otp`, 120, JSON.stringify(this.otp));

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP for mompharmacy dashboard login",
      text: `Your OTP for login is ${this.otp}`,
    };

    // use async/await to catch errors clearly
    const info = await transportMail.sendMail(mailOptions);
    console.log("Email sent:", info.response);

    return this.success(res, { email }, "OTP sent successfully");
  } catch (error) {
    console.error("Login error:", error);
    return this.error(res, 500, "Internal server error", error);
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
