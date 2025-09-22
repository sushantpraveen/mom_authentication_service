const express = require("express")
const UserController = require("../controllers/UserController")
const nodemailer=require('../controllers/nodemailer')

const router = express.Router()
const Users = new UserController()
const mailer=new nodemailer()

router.post("/mail",mailer.createMail.bind(mailer))
router.post("/send",mailer.mail.bind(mailer))
router.get("/user" ,Users.Users)

module.exports  = router
