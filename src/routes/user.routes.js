const express = require("express")
const UserController = require("../controllers/UserController")


const router = express.Router()
const Users = new UserController()


router.get("/user" ,Users.Users)

module.exports  = router
