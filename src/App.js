const express = require("express");
const cors = require("cors");
const session = require("express-session");
const UsersRoutes = require("./routes/user.routes");
const { connectRedisClient } = require("./services/redisClient");
const AccessRoutes=require('./routes/AccessRoutes')

class App {
  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.app.use(
      cors({
        origin: "http://localhost:5173", 
        credentials: true, 
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );
    this.app.use((req, res, next) => {
      console.log("Headers:", req.headers["content-type"]);
      console.log("Raw body:", req.body);
      next();
    });
    this.app.use(
      session({
        secret: process.env.SESSION_SECRET || "charan",
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: false, 
          maxAge: 1000 * 60 * 5,
        },
      })
    );

    this.routes();
    this.middlewares();
    connectRedisClient();
  }

  routes() {
    this.app.use("/api", UsersRoutes);
    this.app.use('/access',AccessRoutes)

    this.app.use("/", (req, res) => {
      res.json({ msg: "You are ready" });
    });
  }

  middlewares() {
    this.app.use(express.json());
  }

  listen(port) {
    this.app.listen(port, "0.0.0.0", () => {
      console.log(`app is running at http://localhost:${port}`);
    });
  }
}

module.exports = App;
