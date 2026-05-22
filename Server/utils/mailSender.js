const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
    try{
        let transporter = nodemailer.createTransport({
            // // host: process.env.MAIL_HOST,
            // service: "gmail",
            // auth: {
            //     user: process.env.MAIL_USER,
            //     pass: process.env.MAIL_PASS,
            // }   

            host: "smtp-relay.brevo.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        console.log("Transporter Created Successfully");

        let info = await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: email,
            subject: title,
            html: body
        });

        console.log("Mail Sent Successfully");
        console.log("Message ID:", info.messageId);
        console.log("SMTP Response:", info.response);
        return info;
    }
    catch(error) {
        console.error(error);

        console.log("Message:", error.message);

        if(error.code) {
            console.log("Code:", error.code);
        }

        if(error.response) {
            console.log("Response:", error.response);
        }

        console.log("======================================");

        throw error;
    }
}

module.exports = mailSender;