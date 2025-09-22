const express = require("express")
const UserController = require("../controllers/UserController")
const user = require("../models/usermodel")


const router = express.Router()
const Users = new UserController()


router.post("/user" ,Users.createuser.bind(Users))
router.get("/getall",Users.getall.bind(Users))
router.post("/login",Users.loginuser.bind(Users))

module.exports  = router
