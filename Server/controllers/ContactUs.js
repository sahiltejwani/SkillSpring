const contactUsEmail = require("../mail/templates/contactFormRes");
const mailSender = require("../utils/mailSender");

exports.contactUsController = async (req, res) => {
    const {email, firstName, lastName, message, phoneNo, countryCode} = req.body;

    console.log(req.body);

    try {
        const emailRes = await mailSender(
            email,
            "Your Data Send Successfully",
            contactUsEmail(email, firstName, lastName, message, phoneNo, countryCode)
        );

        console.log("Email Res ", emailRes);

        return res.json({
            success: true,
            message: "Email send successfully",
        });
    }
    catch(error) {
        console.log("Error: ", error);
        console.log("Error message: ", error.message);
        return res.json({
            succes: false,
            message: "Something went wrong...",
        })
    };
};