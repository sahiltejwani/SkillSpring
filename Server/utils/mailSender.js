const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
    try{

        console.log("========== MAIL SENDER START ==========");
        console.log("TO:", email);
        console.log("SUBJECT:", title);


        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            }
        });

        console.log("Transporter Created Successfully");

        let info = await transporter.sendMail({
            // from: 'SkillSpring || Sahil Tejwani',
            // to: `${email}`,
            // subject: `${title}`,
            // html: `${body}`

            from: process.env.MAIL_USER,
            to: email,
            subject: title,
            html: body
        });

        console.log("Mail Sent Successfully");
        console.log("Message ID:", info.messageId);
        console.log("SMTP Response:", info.response);

        console.log("========== MAIL SENDER END ==========");

        return info;
    }
    catch(error) {
        console.log("========== MAIL SENDER ERROR ==========");
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