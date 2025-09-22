const nodemailer=require("nodemailer")
const transportMail=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:"mompharmacyplay@gmail.com",
        pass:"wkvrtaatubdpnlnp"
    },
});
module.exports=transportMail