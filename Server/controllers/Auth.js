const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const Profile = require("../models/Profile");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const mailSender = require("../utils/mailSender");
const passwordUpdated = require("../mail/templates/passwordUpdate");
const otpTemplate = require("../mail/templates/emailVerificationTemplate");

// Send OTP 
// -> handles the otp generation part
// check for the user have already registered
// otp should be unique -> otp should add to db for checking later

exports.sentOTP = async(req, res) => {

    try {
        const { email } = req.body;
    
        const checkUserPresent = await User.findOne({email});
    
        if(checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: 'User already registered'
            })
        }
    
        // generate otp
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log("OTP generated: ", otp); 

        // check for the unique otp
        const result = await OTP.findOne({otp: otp});

        while(result) {
            otp = otpGenerator(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false
            })
        }

        const otpPayload = { email, otp };
        
        // create and entry in db for OTP
        const otpBody = await OTP.create(otpPayload);
        console.log("OTP Body: ", otpBody);

        await mailSender(email, "OTP Verification", otpTemplate(otp));

        res.status(200).json({
            success: true,
            message: 'OTP Sent Successfully',
            otp,
        })
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }

}



// Signup
exports.signUp = async(req, res) => {
    try {
        // data fetch from the req.body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;

        // validate karo
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(403).json({
                success: false,
                message: "All fields are required",
            })
        }


        // 2 password match karo
        if(password != confirmPassword) {
            return res.statu(400).json({
                success: false,
                message: 'Password and ConfirmPassword Value does not match, please try again'
            });
        }

        // chekc use already exist or not
        const existingUser = await User.findOne({ email });
        if(existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User is already registered'
            }) 
        }

        // find most recent OTP stored for the user
        const recentOtp = await OTP.find({email})
                                    .sort({createdAt: -1})
                                    .limit(1);
        console.log(recentOtp);

        // validate otp
        if(recentOtp.length == 0) {
            // OTP not found 
            return res.status(400).json({
                success: false,
                message: 'OTP not Found'
            });
        }
        else if(otp !== recentOtp[0].otp) {
            // Invalid OTP
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",  
            })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // // Create the user
        // let approved = ""
        // approved === "Instructor" ? (approved = false) : (approved = true)

        // create entry in db
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null
        });

        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
            // DiceBear for random images (initial ki) temporary
        })

        // return res  
        return res.status(200).json({
            success: true,
            message: 'User is registered Successfully',
            user,
        });
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "User cannot be registered. Please try again",
        })
    }
}


// Login
exports.login = async (req, res) => {
    try {
        // get data from req.body
        const {email, password} = req.body;

        // validation data
        if(!email || !password) {
            return res.status(403).json({
                success: false,
                message: 'All fields are required, please try again',
            });
        }

        // user check exist or not
        const user = await User.findOne({email}).populate("additionalDetails");
        if(!user) {
            return res.status(401).json({
                success: false,
                message: "User is not registered, Pkease signup first",
            })
        }  

        // generate JWT., after password matching
        if(await bcrypt.compare(password, user.password)) {

            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            }

            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "2h"
            });

            user.token = token;
            user.password = undefined;
            
            // create col=okie and send response
            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly: true,
            }

            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: 'Logged in successfully',
            })
        }
        else {
            return res.status(401).json({
                success: false,
                message: "Password is incorrect",
            });
        }
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Login Failure, please try again',
        })
    }
}


// Change Password
exports.changePassword = async (req, res) => {
    try {
        // get data form req body
        const userDetails = await User.findById(req.user.id);
        
        console.log(userDetails);

        // get oldPass, newPass, confirmNewPass
        const { oldPassword, newPassword } = req.body;

        // validation
        const isPasswordMatch = await bcrypt.compare(
            oldPassword,
            userDetails.password
        )

        if(!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "The password is incorrect"
            });
        };

        // update pwd in Db
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            { password: hashedNewPassword },
            { new: true }
        );

        // send mail - Password updated
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                "Password for your account has been updated",
                passwordUpdated(
                updatedUserDetails.email,
                updatedUserDetails.firstName)
            );
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: "Error occured while sending an mail for change password"
            })
        }

        // return response
        return res.status(200).json({
            success: true,
            message: "Password updated Successfully."
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error occured while updating password"
        })
    }
}
