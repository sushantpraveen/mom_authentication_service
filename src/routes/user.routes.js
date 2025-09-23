const express = require("express");
const UserController = require("../controllers/UserController");
const MailLogin = require("../controllers/nodemailer");
const verifySession = require("../middlewares/verifySessions");

const router = express.Router();

const Users = new UserController();
const mailer = new MailLogin();

router.post("/mail", mailer.createMail.bind(mailer));
router.post("/send", mailer.mail.bind(mailer));
router.post("/verify", verifySession, mailer.verifyMail.bind(mailer));
router.post("/user" ,Users.createuser.bind(Users))
router.post("/login",Users.loginuser.bind(Users))
router.get("/getall",Users.getall.bind(Users))
router.delete("/delete/:id",Users.delete.bind(Users))
router.post('/emailverify',Users.verify.bind(Users))


module.exports = router;
