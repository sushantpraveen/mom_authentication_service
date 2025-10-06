const UserModel = require("../models/usermodel");
const sendEmail = require("../utils/EmailService");

const ForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = user.createResetPasswordToken();
    await user.save();

    // Log raw token in console for testing
    console.log("RESET TOKEN (copy this into frontend):", resetToken);

    // Create reset URL for frontend
    const resetURL = `http://localhost:5173/reset-password?token=${resetToken}`;

    // Email content
    const html = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetURL}">Reset Password</a>
      <p>Link expires in 10 minutes.</p>
    `;

    await sendEmail(user.email, "Reset Your Password", html);

    res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
};

module.exports = ForgotPassword;
