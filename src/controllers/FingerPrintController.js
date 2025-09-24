const BaseController = require("./BaseController");
const users=require('../models/usermodel')
const {generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse} 
    =require('@simplewebauthn/server')

class FingerPrintController extends BaseController{
      
      async registerOptions(req,res){                         
               try{ 
               const {email,mobileNumber}= req.body      
               const query=[]  
                if(mobileNumber)query.push({mobileNumber}) 
                    if(email)query.push({email})                       
                const user= await users.findOne({$or:query})
  
                if(!user)  this.error(res,404,"User Not Found",)
                    console.log('this is the user',user);                   
                    
                  const generate= await generateRegistrationOptions({
                        rpID:'localhost',
                        rpName:"mom authentication",
                        userName:'vineela',
                        displayName:'master'
                })
                console.log("this is the current challenge",generate);               
                user.currentChallenge=generate.challenge
                await user.save()               
                this.success(res,generate,user,"Registration Options Generated Successfully!!!!!")
                }
            catch(e){
                console.log("this is the error ",e);
                
                    this.error(res,500,'Internal Server Error',e)
            }
    }

    async verifyChallenge(req,res){
        try{
            const{email,mobileNumber,cred}=req.body
             const query=[]  
                if(mobileNumber)query.push({mobileNumber}) 
                    if(email)query.push({email})                       
                const user= await users.findOne({$or:query})
  
                if(!user)  this.error(res,404,"User Not Found")
                    // console.log('this is the user',user); 
                    // console.log('this is the cred',cred);                      
                const challenge=user.currentChallenge
                const verification= await verifyRegistrationResponse({
                    expectedChallenge:challenge,
                    expectedOrigin:'http://localhost:5173',
                    expectedRPID:'localhost',
                    response:cred
                })
                if(!verification.verified) return res.json({msg:"could not verify"})
                    const {credential}=verification.registrationInfo
                user.credentialID=Buffer.from(credential.id,"base64url")
                user.publicKey=Buffer.from(credential.publicKey)
                user.counter=credential.counter
                await user.save()
                console.log("user saved successfully with id,key,counter");
                this.success(res,"user registered successfully")
        }
        catch(e){
             console.log("this is the error ",e);                
                    this.error(res,500,'Internal Server Error',e)
        }
    }

    //login challenge
    async loginChallenge(req,res){
          try{
                const{email,mobileNumber}=req.body
             const query=[]  
                if(mobileNumber)query.push({mobileNumber}) 
                    if(email)query.push({email})                       
                const user= await users.findOne({$or:query})
                if(!user)  this.error(res,404,"User Not Found",)
                    const options=await generateAuthenticationOptions({
                   rpID:'localhost'
                })
                user.currentChallenge=options.challenge
                await user.save()
                this.success(res,options,'Authentication options')
          }
          catch(e){
                 console.log("this is the error ",e);                
                    this.error(res,500,'Internal Server Error',e)
          }
    }

    async verify(req,res){
        try{
                const{email,mobileNumber,cred}=req.body
             const query=[]  
                if(mobileNumber)query.push({mobileNumber}) 
                    if(email)query.push({email})                       
                const user= await users.findOne({$or:query})
                if(!user)  this.error(res,404,"User Not Found")
                    const challenge=user.currentChallenge
                const credential={
                      id: Buffer.from(user.credentialID, 'base64url'),
                      publicKey: Buffer.from(user.publicKey, 'base64url'),
                    counter:user.counter || 0
                }
                const result= await verifyAuthenticationResponse({
                    expectedChallenge:challenge,
                     expectedOrigin:'http://localhost:5173',
                    expectedRPID:'localhost',
                    response:cred,
                    credential
                })
                console.log("this is the result not verifying",result)
                if(!result.verified) return res.json({msg:'Something Went Wrong'})
                    user.counter=result.authenticationInfo.newCounter
                await user.save()
                this.success(res,'user login successfully')
        }
        catch(e){
            console.log("this is the error ",e);                
                    this.error(res,500,'Internal Server Error',e.message)
        }
    }
}

module.exports=FingerPrintController