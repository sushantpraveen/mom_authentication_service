const BaseController=require('../controllers/BaseController')
const AccessControl = require('../models/accessmodel')
const AccessSchema=require('../models/accessmodel')

class AccessController extends BaseController{

//create users
   async CreateUsers(req,res){
          try{
            const {fullName,role,number,email,storeId,permissions}=req.body
            if(!fullName || !role || !number || !email || !storeId || !permissions){
                this.error(res,500,"All Fileds Are Mandatory")
            }
            const user=await AccessSchema.findOne({email})
            if(user) this.error(res,200,'User Already Exists')

                const newUser=new AccessSchema({
                    fullName,
                    role,
                    number,
                    email,
                    storeId,
                    permissions
                })
                await newUser.save()
                this.success(res,200,"User Created Successfully",newUser )
          }
          catch(e){
               this.error(res, 500, "internal server error", e.message);
          }
   }

   //GET USERS

 async GetAllUsers(req,res){
    try{
      const users=await AccessControl.find({})
      this.success(res, 400, { users });
    }
    catch(e){
      this.error(res, 500, "internal server error", e.message);
    }
 }


}


module.exports=AccessController