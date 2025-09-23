require("dotenv").config()
const App = require("./src/App");
const DBConnect = require("./src/utils/DBConnect");


DBConnect() 
const app = new App()

app.listen(process.env.PORT || 3005)