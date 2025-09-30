const jwt = require("jsonwebtoken");
const User = require("../models/usermodel");

const verifyToken = (roles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];
      if (!authHeader) {
        return res.status(401).json({ message: "header is missing" });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return res.status(403).json({ message: "token is missing" });
      }
      const decode = jwt.verify(token, process.env.SECRET_KEY);
      console.log("Decoded Token:", decode);
      const user = await User.findById(decode.id);
      if (!user) { 
        return res.status(404).json({ message: "user not found" });
      }

      req.user = user;

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ message: "access denied" });
      }

      next();
    } catch (err) {
      console.error("Authentication Error:", err.message);
      return res.status(403).json({ message: "invalid token" });
    }
  };
};

module.exports = verifyToken;
