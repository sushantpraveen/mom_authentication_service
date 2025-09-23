function verifySession(req, res, next) {
  try {
    if (!req.session) {
      return res.status(401).json({ msg: "Session not found" });
    }
    if (!req.session.otp) {
      return res.status(401).json({ msg: "No OTP found in session" });
    }
    req.otp = req.session.otp;

    next();
  } catch (error) {
    console.log("Error in verifying session:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
}

module.exports = verifySession;
