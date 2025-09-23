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
router.get("/user", Users.Users);

module.exports = router;
