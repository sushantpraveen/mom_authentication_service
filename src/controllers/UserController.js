const BaseController = require("./BaseController");


class UserController extends BaseController{
    Users(req , res){
        try{
            this.success(res , {} ,  "you are ready" )
        }catch(error){
            this.error(res , 500 , "internal server error" , error)
        }
    }
}

module.exports = UserController