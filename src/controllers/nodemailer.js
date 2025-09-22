const BaseController=require("./BaseController")
const transportMail=require("../utils/nodemailer")
const user=require("../models/usermodel")

class mailLogin extends BaseController{
    async createMail(req,res){
    try {
        const {email}=req.body;
        console.log("email",email);
        const newUser=new user({email});
        console.log("hi");
        await newUser.save();
        this.success(res,newUser,"Status 200 OK");
        console.log("mail created sucessfully");
    }
    catch(error){
        this.error(res,400,"error in creating mail");
    }
}


    async mail(req, res) {
    const { email } = req.body;
    try {
        if (!email) {
            return this.error(res, 400, "Before you proceed enter your email");
        }

        console.log("email", email);

        const emailuser = await user.findOne({ email });
        if (!emailuser) {
            return this.error(res, 404, "Enter Valid Email Id");
        }

        const otp = Math.floor(100000 + Math.random() * 900000);

        let mailOptions = {
            from: "mompharmacyplay@gmail.com",
            to: email,
            subject: "OTP for mompharmacy dashboard login",
            text: `Hey there, here is your OTP for mompharmacy dashboard login ${otp}`,
        };

        transportMail.sendMail(mailOptions, (error, info) => {
            if (error) {
                return this.error(res, 500, "Unable to send email");
            }

            req.session.otp = otp;
            req.session.email = email;

            return this.success(res, {
                email,
                otp,
                mailOptions,
                session: { email: req.session.email, otp: req.session.otp },
                info: info.response,
            }, "OTP generated and sent successfully");
        });

    } catch (err) {
        console.error("Internal server error", err);
        this.error(res, 500, "Internal server error");
    }
}

}

module.exports=mailLogin