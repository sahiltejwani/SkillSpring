const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const CourseProgress = require("../models/CourseProgress");
const mongoose = require("mongoose");
const crypto = require("crypto");
const mailSender = require("../utils/mailSender");

const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");

exports.capturePayment = async (req, res) => {
    const { courses } = req.body;
    const userId = req.user.id;

    if (!courses || courses.length === 0) {
        return res.json({ success: false, message: "Please provide course ID(s)" });
    }

    let total_amount = 0;

    for (const course_id of courses) {
        try {
            const course = await Course.findById(course_id);
            if (!course) {
                return res.status(404).json({ success: false, message: "Course not found" });
            }

            const uid = new mongoose.Types.ObjectId(userId);
            if (course.studentEnrolled.includes(uid)) {
                return res.status(200).json({ success: false, message: "Student already enrolled" });
            }

            total_amount += course.price;
        }
        catch (error) {
            console.error("Error finding course:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    const options = {
        amount: total_amount * 100,
        currency: "INR",
        receipt: Math.random(Date.now()).toString(),
    };

    try {
        console.log("KEY:", process.env.RAZORPAY_KEY);
        console.log(
        "SECRET PRESENT:",
        process.env.RAZORPAY_SECRET ? "YES" : "NO"
        );
        
        const paymentResponse = await instance.orders.create(options);
        return res.json({ success: true, data: paymentResponse });
    } 
    catch (error) {
        console.error("Razorpay Error:", error);
        return res.status(500).json({ success: false, message: "Could not initiate order." });
    }
};

exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courses } = req.body;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses || !userId) {
        return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex");

    if (expectedSignature === razorpay_signature) {
        await enrollStudents(courses, userId, res);
        return res.status(200).json({ success: true, message: "Payment Verified" });
    } else {
        return res.status(400).json({ success: false, message: "Invalid Signature" });
    }
};

exports.sendPaymentSuccessEmail = async (req, res) => {
    const { orderId, paymentId, amount } = req.body;
    const userId = req.user.id;

    if (!orderId || !paymentId || !amount || !userId) {
        return res.status(400).json({ success: false, message: "Missing payment details" });
    }

    try {
        const enrolledStudent = await User.findById(userId);

        await mailSender(
        enrolledStudent.email,
        "Payment Received",
        paymentSuccessEmail(
            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
            amount / 100,
            orderId,
            paymentId
        )
        );

        return res.status(200).json({ success: true, message: "Payment email sent" });
    } catch (error) {
        console.error("Error sending payment success email:", error);
        return res.status(500).json({ success: false, message: "Could not send email" });
    }
};

const enrollStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res.status(400).json({ success: false, message: "Missing course or user ID" });
  }

  for (const courseId of courses) {
    try {
        const enrolledCourse = await Course.findOneAndUpdate(
            { _id: courseId },
            { $push: { studentEnrolled: userId } },
            { new: true }
        );

        if (!enrolledCourse) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        const courseProgress = await CourseProgress.create({
            courseID: courseId,
            userId: userId,
            completedVideos: [],
        });

        const enrolledStudent = await User.findByIdAndUpdate(
            userId,
            {
            $push: {
                courses: courseId,
                courseProgress: courseProgress._id,
            },
            },
            { new: true }
        );

        await mailSender(
            enrolledStudent.email,
            `Successfully Enrolled into ${enrolledCourse.courseName}`,
            courseEnrollmentEmail(
                enrolledCourse.courseName,
                `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
            )
        );

        console.log("Enrollment and email successful");
    }
    catch (error) {
        console.error("Enrollment Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
  }
};


// // capture the payment and initiate the Razorpay order]
// exports.capturePayment = async (req, res) => {
//     try {
//         // get courseId and userId
//         const {course_id} = req.body;
//         const userId = req.user.id;

//         // validation
//         // valid courseId
//         if(!course_id) {
//             return res.status(404).json({
//                 success: false,
//                 message: "plase provide valid course ID",
//             })
//         }

//         // valid courseDetails
//         const courseDetails = await Course.findById(course_id);
//         if(!courseDetails) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Could not find the course",
//             });
//         };

//         // user already payed for the same course
//         if (courseDetails.studentEnrolled.some(id => id.equals(userId))) {
//             return res.status(200).json({
//                 success: false, 
//                 message: "Student is already registered",
//             })
//         }

//         // order create
//         const amount = courseDetails.price;
//         const currency = "INR";

//         const options = {
//             amount: amount * 100,
//             currency,
//             receipt: Math.random(Date.now()).toString(),
//             notes: {
//                 courseId: course_id,
//                 userId,
//             }
//         }

//         try {
//             // intiate the payment using razorpay
//             const paymentResponse = await instance.orders.create(options);
//             console.log(paymentResponse);
            
//             // return response
//             return res.status(200).json({
//                 success: true,
//                 courseName: courseDetails.courseName,
//                 courseDescription: courseDetails.courseDescription,
//                 thumbnail: courseDetails.thumbnail,
//                 orderId: paymentResponse.id,
//                 currency: paymentResponse.currency,
//                 amount: paymentResponse.amount,
//             });
//         }
//         catch(error) {
//             console.log(error);
//             res.status(500).json({
//                 success: false,
//                 message: error.message,
//             })
//         };
        
//     }
//     catch(error) {
//         console.log(error);
//         return res.status(500).json({
//             success: false,
//             message: "Error occured in the capture Payment",
//         });
//     };
// };

// // verify Signature of Razorpay and Server
// exports.verifySignature= async (req, res) => {
//     const webhookSecret = "12345678";

//     const signature = req.headers["x-razorpay-signature"];

//     // hashing along with tht help of secret key
//     const shasum = crypto.createHmac("sha256", webhookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest = shasum.digest("hex");

//     if(signature == digest) {
//         console.log("Payment is authorized");
//         // now the action after the payment

//         // courseId and UserId notes main se nikalege abhi nahi nikal sakte tum from re.body kyuki ye razpay se aay hai frontned se nahi
//         const {courseId, userId} = req.body.payload.payment.entity.notes;

//         try {
//             // fullfil the action
//             // find the  course and enroll the student in it
//             const enrolledCourse = await Course.findOneAndUpdate(
//                 {_id: courseId},
//                 {
//                     $push: {
//                         studentEnrolled: userId,
//                     },
//                     $inc: {
//                         sold: 1,
//                     },
//                 },
//                 {new: true},
//             );

//             if(!enrolledCourse) {
//                 return res.status(500).json({
//                     success: false,
//                     message: "Course not Found",
//                 });
//             }

//             console.log(enrolledCourse);

//             // find the student and add the course to their list enroll courses main
//             const enrolledStudent = await User.findOneAndUpdate(
//                                             {_id: userId},
//                                             {
//                                                 $push: {courses: courseId}
//                                             },
//                                             {new: true},
//             );

//             console.log(enrolledStudent);


//             // mail Sned krdo confimation wala
//             const emailResponse = await mailSender(enrolledStudent.email,
//                 "Buyed: Course of Skill Spring",
//                 "Congratulations, you are onboarded into new Skill Spring Course"
//             );

//             console.log(emailResponse);
//             return res.status(200).json({
//                 success: true,
//                 message: "Sgnature Verified and Course added"
//             })
//         }
//         catch(error) {
//             console.log(error);
//             return res.status(500).json({
//                 success: false,
//                 message: error.message,
//             });
//         };
//     }
//     else {
//         res.status(400).json({
//             success: false,
//             message: "Invalid request",
//         });
//     };
// };