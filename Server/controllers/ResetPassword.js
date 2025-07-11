const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const crypto = require("crypto");
const brcypt = require("bcrypt");

// RestPasswordToken -> link generate karega aur mail main bhejega
// wahi link hai identify karne ke liye ek token generate karege
exports.resetPasswordToken = async (req, res) => {
    try {
        // get email from req body
        const email = req.body.email;
        // check user for the email
        const user = await User.findOne({email: email});

        if(!user) {
            return res.json({
                success: false,
                message: 'Your Email is not registered with us'
            });
        };

        // link generate
        // tkoen generate karne ke liye crypto is the library
        const token = crypto.randomUUID();
        // update user bu adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate(
                                                {email: email},
                                                {
                                                    token: token,
                                                    resetPasswordExpires: Date.now() + 5*60*1000
                                                },
                                                {new: true}
        )

        // create URL
        const url = `http://localhost:5173/update-password/${token}`;

        // send mail containing the url
        await mailSender(email,
            "Password Reset",
			`Your Link for email verification is ${url}. Please click this url to reset your password.`
        );

        // return response
        return res.json({
            success: true,
            message: 'Email sent successfully, please check email and change Password'
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while reset password or mail'
        });
    };
};



// resetPasswrd
exports.resetPassword = async (req, res) => {
    try {
        // data fetch
        const {password, confirmPassword, token} = req.body;
        
        // validation
        if(password != confirmPassword) {
            return res.json({
                success: false, 
                message: "Password not matching",
            })
        }

        // get userdetails using the token from DB
        const userDetails = await User.findOne({token: token});

        // if no entry -invalid token
        if(!userDetails) {
            return res.json({
                success: false,
                message: 'TOken is invalid',
            });
        };

        // token time check
        if(userDetails.resetPasswordExpires < Date.now()) {
            return res.json({
                success: false,
                message: 'Token is expired, please regenrate your token',
            });
        };

        // hash password
        const hashedPassword = await brcypt.hash(password, 10);

        // password update 
        await User.findOneAndUpdate(
            {token: token},
            {password: hashedPassword},
            {new: true},
        )

        // return response
        return res.status(200).json({
            success: true,
            message: 'Password reset successfully',
        });
    }
    catch(error) {
        console.log(error);
        return res.json({
            success: false,
            message: 'Something went wrong in the reset password or your token verification'
        });
    };
};