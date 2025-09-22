const express = require("express")
const UsersRoutes = require('./routes/user.routes')

class App{
    constructor(){
        this.app = express()
        this.middlewares()
        this.routes() 
    }

    routes(){
        this.app.use("/api" , UsersRoutes)
    }

    middlewares(){
        this.app.use(express.json())
    }

    listen(port){
        this.app.listen(port , ()=>{
            console.log(`app is running at http://localhost:${port}`)
        })
    }
}

module.exports = App