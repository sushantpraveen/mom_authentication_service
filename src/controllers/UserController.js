const { default: mongoose } = require("mongoose");
const user = require("../models/usermodel");
const { client } = require("../services/redisClient");
const transportMail = require("../utils/nodemailer");
const BaseController = require("./BaseController");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const toast = require("react-hot-toast");
class UserController extends BaseController {
  constructor() {
    super();
    this.otp = null;
  }

  // Create users (direct, without OTP)
  async createuser(req, res) {
    try {
      console.log("this is running...");
      const { fullname, email, pincode, mobileNumber, password,Status,role} = req.body;

      if (!fullname || !email || !pincode || !mobileNumber || !password || !Status || !role) {
        return this.error(res, 404, "All fields are required");


      const userexisted = await user.findOne({ email });
      if (userexisted) {
        return this.error(res, 409, "User already existed");
      } else {
        const hashpassword = await bcrypt.hash(password, 10);

        const newuser = new user({
          fullname,
          email,
          pincode,
          mobileNumber,
          role,
          Status,
          password: hashpassword,
        });
        await newuser.save();
        return this.success(res, 200, "user created successfully", newuser);
      }
    } catch (err) {
      this.error(res, 500, "internal server error", err.message);
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
      // const redisotp= await client.setEx(`signup:${email}:otp`, 300, JSON.stringify(this.otp)); // 5 minutes

      const redisotp = await client.set(
        `signup:${email},otp:`,
        JSON.stringify(this.otp),
        "EX",
        300
      );

      console.log(
        "this is the otp we are setting in the redis",
        redisotp,
        this.otp
      );

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "OTP for mompharmacy signup",
        text: `Your OTP for signup is ${this.otp}`,
      };

      const info = await transportMail.sendMail(mailOptions);
      console.log("Signup OTP email sent:", info.response);

      return this.success(res, { data: email }, "OTP sent successfully");
    } catch (err) {
      console.error("Signup OTP error:", err);
      return this.error(res, 500, "Internal server error", err);
    }
  }

  // Request OTP for signup (only if invited)
  async requestSignupOtp(req, res) {
    try {
      const { email } = req.body;
      if (!email) return this.error(res, 400, "Email is required");

      const redisInvite = await client.get(`invite:${email}`);
      if (!redisInvite)
        return this.error(
          res,
          400,
          " Enter the same email that was invited for onboarding"
        );

      const redisOtp = await client.get(`signup:${email},otp:`);
      console.log("this is the error for the otp in the redis", redisOtp);
      if (!redisOtp) return this.error(res, 400, "OTP expired or not found");

      // Check user does NOT exist already
      const existUser = await user.findOne({ email });
      if (existUser) return this.error(res, 409, "User already exists");

      // Generate OTP v
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
      if (!email || !otp)
        return this.error(res, 400, "Email and OTP are required");

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

      const token = jwt.sign({ email, role }, process.env.SECRET_KEY, {
        expiresIn: "24h",
      });

      const signupLink = `${process.env.FRONTEND_URL}/signup?token=${token}`;

      //invited email + role in Redis
      await client.setEx(
        `invite:${email}`,
        3600,
        JSON.stringify({ email, role })
      );

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

  // Login users
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

      const info = await transportMail.sendMail(mailOptions);
      console.log("Email sent:", info.response);

      return this.success(res, { email }, "OTP sent successfully");
    } catch (error) {
      console.error("Login error:", error);
      return this.error(res, 500, "Internal server error", error);
    }
  }

  // Email verification for login
  async verify(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return this.error(res, 400, "Email and OTP fields are required");
      }

      const emailexisted = await user.findOne({ email });
      if (!emailexisted) {
        return this.error(res, 404, "User not found");
      }

      const redisOtp = await client.get(`${email}:otp`);
      if (!redisOtp) return this.error(res, 400, "OTP expired or not found");

      const parsedOtp = JSON.parse(redisOtp);

      if (Number(parsedOtp) === Number(otp)) {
        const token = jwt.sign(
          { id: emailexisted._id },
          process.env.SECRET_KEY,
          { expiresIn: "12h" }
        );

        await client.setEx(
          `user:${token}`,
          43200,
          JSON.stringify({ id: emailexisted._id })
        );

        console.log("This is token", token);

        return this.success(res, token, "OTP verified successfully");
      } else {
        return this.error(res, 400, "Invalid OTP or email");
      }
    } catch (error) {
      console.error(" error:", error);
      return this.error(res, 500, "Internal server error");
    }
  }

  // Get all users with infinite scrolling
  async getall(req, res) {
  try {
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 10);
    const rawCursor = req.query.cursor;

    // to avoid issues with "null", "undefined" or empty string
    const cursor = (rawCursor === undefined || rawCursor === null || String(rawCursor).trim() === '' || String(rawCursor) === 'null' || String(rawCursor) === 'undefined')
      ? null
      : String(rawCursor);

    // console.log('[getall] limit:', limit, 'rawCursor:', rawCursor, 'normalized cursor:', cursor);

    const query = {};

    // If a cursor exists verify it's a valid ObjectId
    if (cursor) {
      const ok = mongoose.Types.ObjectId.isValid(cursor);
      console.log('cursor validity check:', ok, 'cursor:', cursor);
      if (!ok) {
        return this.error(res, 400, 'Invalid cursor value');
      }

      // ObjectId conversion
      try {
        const cursorObj = new mongoose.Types.ObjectId(cursor);
        query._id = { $gt: cursorObj }; // matches your ascending sort
      } catch (err) {
        console.error('[getall] error converting cursor to ObjectId:', err);
        return this.error(res, 400, 'Invalid cursor value (conversion failed)');
      }
    }

    console.log('[getall] final query object:', JSON.stringify(query));

    // Fetch limit + 1
    const allusers = await user.find(query)
      .sort({ _id: 1 }) // ascending; matches $gt above
      .limit(limit + 1)
      .lean();

    console.log('[getall] fetched count:', allusers.length);

    let hasMore = false;
    let nextCursor = null;
    let pageUsers = allusers;

    if (allusers.length > limit) {
      hasMore = true;
      // pop the extra to return exactly `limit`
      pageUsers = allusers.slice(0, limit);
      const extraUser = allusers[limit]; // extra fetched user
      nextCursor = extraUser?._id?.toString() ?? null;
    } else if (allusers.length > 0) {
      nextCursor = allusers[allusers.length - 1]._id.toString();
    }

    // success response
    return this.success(res, 200, { allusers: pageUsers, hasMore, nextCursor });
  } catch (error) {
    // log full stack for debugging
    console.error('[getall] unexpected error:', error && error.stack ? error.stack : error);
    return this.error(res, 500, "internal server error", error);
  }
}


  //update by id or edit
  async editmembers(req, res) {
    try {
      const id = req.params.id;
      const users = await user.findByIdAndUpdate(id, req.body);
      if (!users)
        return res
          .status(404)
          .json({ msg: "unable to edit the member", users });
      console.log("this is the updated user", users);
      this.success(
        res,
        200,
        `Successfully edited the member${JSON.stringify(users)} details`
      );
    } catch (e) {
      this.error(res, 500, "internal server error", e.message);
    }
  }

  //Search funnctinality

  async searchmember(req, res) {
    try {
      const { search, ...filters } = req.query;
      let query = {};
      if (search) {
        query.$or = [
          { role: { $regex: search, $options: "i" } },
          { fullname: { $regex: search, $options: "i" } },
        ];
      }
      if (filters.supprotType) {
        query.supportType = filters.supportType;
      }
      const allmembers = await user.find(query);

      if (!allmembers) {
        return this.error(res, 400, "Unable to fetch the members ");
      }
      return this.error(res, 200, { allmembers });
    } catch (e) {
      this.error(res, 500, "internal server error", e.message);
    }
  }

  // delete user
  async delete(req, res) {
    const { id } = req.params;
    try {
      const deleteuser = await user.findByIdAndDelete(id);
      if (!deleteuser) {
        return this.error(res, 404, "user not found");
      }
      return this.success(res, 200, "user deleted successfully");
    } catch (error) {
      return this.error(res, 500, "internal server error");
    }
  }
}

module.exports = UserController;
