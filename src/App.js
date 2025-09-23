const express = require("express")
const UsersRoutes = require('./routes/user.routes')
const cors=require('cors')

class App{
    constructor(){
        this.app = express()
        this.app.use(express.json())
        this.app.use(cors())
        this.routes() 
        this.middlewares()
    }

    routes(){
        this.app.use("/api" , UsersRoutes)

        this.app.use("/" , (req, res)=>{
            res.json({msg:"You are ready"})
        })
    }

    middlewares(){

    }

    listen(port){
        this.app.listen(port , ()=>{
            console.log(`app is running at http://localhost:${port}`)
        })
    }
}

module.exports = App