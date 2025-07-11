const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");


// auth
exports.auth = async (req, res, next) => {
    try {
        // extract token
        console.log("User from auth middleware:", req.user);
        const headerToken = req.header("Authorization");
        const token = req.cookies?.token || req.body?.token || headerToken?.replace("Bearer ", "");

        console.log("Header Authorization:", headerToken);
        console.log("Token Extracted:", token);
        // const token = req.cookies?.token || req.body?.token || req.header("Authorization")?.replace("Bearer ", "");

        // if token missing, then return response
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token is missing",
            });
        }

        // verify the token
        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decode);
            req.user = decode;

            console.log("req.user in middleware:", req.user);
        }
        catch (error) {
            // verification - issue
            return res.status(401).json({
                success: false,
                message: "Token is invalid",
            });
        };
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: "Something went wrong while validating the token",
            error: error.message
        });
    };
}


// isStudent
exports.isStudent = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Student") {
            return res.status(401).json({
                success: false,
                message: 'This is a protected route for Students',
            })
        }
        next();
    }
    catch {
        return res.status(500).json({
            success: false,
            message: "User role cannot be verified, please try again"
        })
    }
}


// isINstructor
exports.isInstructor = async (req, res, next) => {
    try {
        if (req?.user?.accountType !== "Instructor") {
            return res.status(401).json({
                success: false,
                message: 'This is a protected route for Instructor',
            })
        }
        next();
    }
    catch {
        return res.status(500).json({
            success: false,
            message: "User role cannot be verified, please try again"
        })
    }
}


// isAdmin
exports.isAdmin = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Admin") {
            return res.status(401).json({
                success: false,
                message: 'This is a protected route for Admin',
            })
        }
        next();
    }
    catch {
        return res.status(500).json({
            success: false,
            message: "User role cannot be verified, please try again"
        })
    }
}

