const Profile = require("../models/Profile");
const User = require("../models/User");
const Course = require("../models/Course");
const CourseProgress = require("../models/CourseProgress")
const { uploadImageToCloudinary } = require("../utils/imageUploader")
const { convertSecondsToDuration } = require("../utils/secToDuration")


exports.UpdateProfile = async (req, res) => {
    try {
        // get data
        const { dateOfBirth = "", about = "", contactNumber = "", gender = "" } = req.body;
        // get userId
        const userId = req.user.id;
        // validation

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Could not get the user id for the updation",
            })
        };

        // find teh profile
        const userDetails = await User.findById(userId);
        const profileId = userDetails.additionalDetails;

        const profileDetails = await Profile.findById(profileId);

        // update teh profile
        // YOU CAN ASLO DO IT BY FINDINGAND UPDATEBYID
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.gender = gender;
        profileDetails.contactNumber = contactNumber;

        await profileDetails.save();

        // Find the updated user details
        const updatedUserDetails = await User.findById(userId)
            .populate("additionalDetails")
            .exec()

        // return response
        return res.status(200).json({
            success: true,
            message: "Profile Updated Successfully",
            data: updatedUserDetails,
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error in updation of profile",
        });
    };
};

// Delete Account
exports.deleteAccount = async (req, res) => {
    try {
        // get id
        const id = req.user.id;

        // validation
        if (!id) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        // get user details
        const userDetails = await User.findById(id);

        // delete profile 
        await Profile.findByIdAndDelete({ _id: userDetails.additionalDetails });

        // TODO : unenroll user form all enrolled courses
        const enrolledCourses = userDetails.courses;

        if (enrolledCourses && enrolledCourses.length > 0) {

            // all should await 
            await Promise.all(
                enrolledCourses.map(async (courseId) => {
                    await Course.findByIdAndUpdate(
                        courseId,
                        {
                            $pull: {
                                studentEnrolled: id,
                            }
                        },
                        { new: true },
                    )
                })
            )
        }

        // delete user
        // await User.findByIdAndDelete({_id: id});
        // OR METHOD , HERE i HAVE USED THE NODE CRONS
        // const deletionTime = new Date(Date.now()
        //                                  + 24 * 60 * 60 * 1000
        //                             );
        // await User.findByIdAndUpdate(id, {
        //     isDeletionRequested: true,
        //     deletionTime,
        // });

        await User.findByIdAndDelete(id);

        // return response
        return res.status(200).json({
            success: true,
            message: "User Deleted Successfully",
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "User cannot be deleted",
        });
    };
};

exports.getAllUserDetails = async (req, res) => {
    try {
        const id = req.user.id;

        if (!id) {
            return res.status(404).json({
                success: false,
                message: "Id of the user to get is missing",
            })
        }

        const userDetails = await User.findById(id).populate("additionalDetails").exec();

        // return response
        return res.status(200).json({
            success: true,
            message: "User Data Fetched Successfully",
            userDetails
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong to fetch all userdetails"
        });
    };
};

// update the display Picture
exports.updateDisplayPicture = async (req, res) => {
    try {
        // get the picute and id of user
        const displayPicture = req?.files?.displayPicture;
        console.log("displayPicture => ", displayPicture);
        const userId = req?.user?.id

        // upload it to cloudinary
        const image = await uploadImageToCloudinary(
            displayPicture,
            process.env.FOLDER_NAME,
            1000,
            1000
        )
        console.log(image);

        // update image in the Db
        const updatedProfile = await User.findByIdAndUpdate(
            { _id: userId },
            { image: image.secure_url },
            { new: true }
        )

        return res.status(200).json({
            success: true,
            message: "Image updated Successfully",
            data: updatedProfile
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Cannot update the display picture",
        })
    }
}

// show the instructor dashboard
exports.instructorDashboard = async (req, res) => {
	try {
		const id = req.user.id;
		const courseData = await Course.find({instructor:id});
		const courseDetails = courseData.map((course) => {
			totalStudents = course?.studentEnrolled?.length;
			totalRevenue = course?.price * totalStudents;
			const courseStats = {
				_id: course._id,
				courseName: course.courseName,
				courseDescription: course.courseDescription,
				totalStudents,
				totalRevenue,
			};
			return courseStats;
		});
		res.status(200).json({
			success: true,
			message: "User Data fetched successfully",
			data: courseDetails,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
}

// show the enrolled courses by the student
exports.getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Could not get the user ID"
            })
        }
        let userDetails = await User.findOne({
            _id: userId,
        })
            .populate({
                path: "courses",
                populate: {
                    path: "courseContent",
                    populate: {
                        path: "subSection",
                    },
                },
            })
            .exec()
        userDetails = userDetails.toObject();
        console.log(userDetails);
        var SubsectionLength = 0
        for (var i = 0; i < userDetails.courses.length; i++) {
            let totalDurationInSeconds = 0
            SubsectionLength = 0
            for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
                totalDurationInSeconds += userDetails.courses[i].courseContent[
                    j
                ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
                userDetails.courses[i].totalDuration = convertSecondsToDuration(
                    totalDurationInSeconds
                )
                SubsectionLength +=
                    userDetails.courses[i].courseContent[j].subSection.length
            }
            let courseProgressCount = await CourseProgress.findOne({
                courseID: userDetails.courses[i]._id,
                userId: userId,
            })
            courseProgressCount = courseProgressCount?.completedVideos.length
            if (SubsectionLength === 0) {
                userDetails.courses[i].progressPercentage = 100
            } else {
                // To make it up to 2 decimal point
                const multiplier = Math.pow(10, 2)
                userDetails.courses[i].progressPercentage =
                    Math.round(
                        (courseProgressCount / SubsectionLength) * 100 * multiplier
                    ) / multiplier
            }
        }

        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find user with id: ${userDetails}`,
            })
        }
        return res.status(200).json({
            success: true,
            data: userDetails.courses,
        })
    } catch (error) {
        console.error("ERROR in getEnrolledCourses:", error);  // ADD THIS
        return res.status(500).json({
            success: false,
            message: "There is problem in fetching the courses enrolled by student",
            error: error.message,
        });
    }
}
