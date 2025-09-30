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


 //updateusers access control

 async UpdateUsers(req,res){
    try{
        const {role,permissions}=req.body
        console.log("this is the role from the body to modify the access manager",role);
        const users=await AccessSchema.updateMany(
            {"role":role},
            {$addToSet :{"permissions":{$each :permissions}}}
        )
        if(!users) return res.status(404).json({msg:'unable to alter the data'})
            console.log("users updated successfully",users);
            return res.status(200).json({msg:'users updated successfully'})
        // this.success('res',200,"updated users successfully",users)
    }
    catch(e){
        console.log('this is the error cauisng to update many',e.message);       
        return res.status(500).json({msg:'Internal Server Error'})
    }
 }


 //remove users access control

 async removeAccessControl(req,res){
    try{
     const {role,permissions}=req.body
        console.log("this is the role from the body to modify the access manager",role);
        const users=await AccessSchema.updateMany(
            {"role":role},
            {$pullAll:{'permissions':permissions}}
        )
         if(!users) return res.status(404).json({msg:'unable to alter the data'})
            console.log("users updated successfully",users);
            return res.status(200).json({msg:'users updated successfully'})
    }
    catch(e){
             console.log('this is the error cauisng to update many',e.message);       
        return res.status(500).json({msg:'Internal Server Error'})
    }
 }


}


module.exports=AccessController