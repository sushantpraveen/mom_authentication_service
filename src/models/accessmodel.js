const mongoose=require('mongoose')

const AccessSchema=  new mongoose.Schema({
    storeId:{
        type:String,
        required:true
    },
    fullName:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:["Admin","Store Manager","Warehouse Manager","Regional Manager"]
    },
    permissions:{
        type:[String],
        enum:["Manage Roles","Access Control","Manage Alerts","Notifications","Manage Profile","Manage Catalogue","Export Catalogue","Order Lists","Export Order Lists","Customer Lists","Export Customer Lists","Manage Stores","Manage Products"]
    },
    number:{
        type:Number
    },
    email:{
        type:String
    },
    status:{
        type:String
    }
})

const AccessControl=mongoose.model("AccessControl",AccessSchema)
module.exports=AccessControl