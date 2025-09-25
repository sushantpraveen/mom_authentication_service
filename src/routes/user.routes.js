const express = require("express");
const UserController = require("../controllers/UserController");
const MailLogin = require("../controllers/nodemailer");
const verifySession = require("../middlewares/verifySessions");


const FingerController=require('../controllers/FingerPrintController')


const router = express.Router();


const Users = new UserController();
const mailer = new MailLogin();


//object for finger print class
const finger= new FingerController()

router.post("/mail", mailer.createMail.bind(mailer));
router.post("/send", mailer.mail.bind(mailer));
router.post("/verify", verifySession, mailer.verifyMail.bind(mailer));
router.post("/user" ,Users.createuser.bind(Users))
router.post("/login",Users.loginuser.bind(Users))
router.get("/getall",Users.getall.bind(Users))
router.delete("/delete/:id",Users.delete.bind(Users))
router.post('/emailverify',Users.verify.bind(Users))
// Signup routes
router.post("/signup/request-otp", Users.requestSignupOtp.bind(Users));
router.post("/signup/verify-otp", Users.verifySignupOtp.bind(Users));
router.post("/signup/create", Users.createUserAfterOtp.bind(Users));
router.post("/invite", Users.inviteUser.bind(Users));


//finger print authentication routes
router.post("/register/challenge",finger.registerOptions.bind(finger))
router.post('/verify/challenge',finger.verifyChallenge.bind(finger))
router.post('/auth/challenge',finger.loginChallenge.bind(finger))
router.post('/auth/verify',finger.verify.bind(finger))

module.exports  = router

