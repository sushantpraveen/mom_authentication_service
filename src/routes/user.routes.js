const express = require("express")
const UserController = require("../controllers/UserController")

const FingerController=require('../controllers/FingerPrintController')


const router = express.Router()
const Users = new UserController()

//object for finger print class
const finger= new FingerController()


router.get("/user" ,Users.Users)

//finger print authentication routes
router.post("/register/challenge",finger.registerOptions.bind(finger))
router.post('/verify/challenge',finger.verifyChallenge.bind(finger))
router.post('/auth/challenge',finger.loginChallenge.bind(finger))
router.post('/auth/verify',finger.verify.bind(finger))

module.exports  = router
