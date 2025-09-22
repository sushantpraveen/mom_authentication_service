const express = require("express")
const UsersRoutes = require('./routes/user.routes')

class App{
    constructor(){
        this.app = express()
        this.routes() 
        this.middlewares()
    }

    routes(){
        this.app.use("/" , (req, res)=>{
            res.json({msg:"You are ready"})
        })
        this.app.use("/api" , UsersRoutes)
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