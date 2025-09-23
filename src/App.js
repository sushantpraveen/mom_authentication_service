const express = require("express")
const session = require("express-session");
const UsersRoutes = require('./routes/user.routes')

class App{
    constructor(){
        this.app = express()
        this.app.use(express.json())
        this.app.use((req, res, next) => {
        console.log("Headers:", req.headers["content-type"]);
        console.log("Raw body:", req.body);
        next();
    });
    this.app.use(session({
        secret: process.env.SESSION_SECRET || "charan",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false, 
            maxAge: 1000 * 60 * 5
      }
    }));

        this.routes() 
        this.middlewares()
        this.routes() 
    }

    routes(){
        // this.app.use("/" , (req, res)=>{
        //     res.json({msg:"You are ready"})
        // })
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