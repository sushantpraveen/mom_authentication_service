const express=require('express')
const router=express.Router()

const AccessRoutes=require('../controllers/AccessController')

const Access= new AccessRoutes()

//CRUD OPERATIONS
router.post('/create',Access.CreateUsers.bind(Access))
router.get('/get',Access.GetAllUsers.bind(Access))

module.exports=router