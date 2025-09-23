const BaseController = require("./BaseController");
const transportMail = require("../utils/nodemailer");
const User = require("../models/usermodel");

class MailController extends BaseController {
  async createMail(req, res) {
    try {
      const { email } = req.body;
      const newUser = new User({ email });
      await newUser.save();
      this.success(res, newUser, "User created successfully");
    } catch (error) {
      this.error(res, 400, "Error in creating mail");
    }
  }

  async mail(req, res) {
    const { email } = req.body;
    try {
      if (!email) return this.error(res, 400, "Enter your email");

      const emailUser = await User.findOne({ email });
      if (!emailUser) return this.error(res, 404, "Email not found");

      const otp = Math.floor(100000 + Math.random() * 900000);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "OTP for mompharmacy dashboard login",
        text: `Your OTP for login is ${otp}`,
      };
      transportMail.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
          return this.error(res, 500, "Unable to send email");
        }

        req.session.otp = otp;
        req.session.email = email;

        this.success(res, {
          email,
          session: { email: req.session.email, otp: req.session.otp },
          info: info.response,
        }, "OTP sent successfully");
      });

    } catch (err) {
      console.error(err);
      this.error(res, 500, "Internal server error");
    }
  }

  async verifyMail(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp)
        return res.status(400).json({ msg: "Email or OTP missing" });

      if (
        req.session.otp &&
        req.session.email === email &&
        parseInt(otp) === req.session.otp
      ) {
        req.session.otp = null;
        return res.status(200).json({ msg: "OTP verified successfully" });
      } else {
        return res.status(400).json({ msg: "Invalid OTP or Email" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Error in OTP verification" });
    }
  }
}

module.exports = MailController;
