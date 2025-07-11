const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const CourseProgress = require("../models/CourseProgress");
const RatingAndReview = require("../models/RatingAndReview");
const { convertSecondsToDuration } = require("../utils/secToDuration")

// create course handler fucntion
exports.createCourse = async (req, res) => {
    try {
        // fetch data
        const {
            courseName,
            courseDescription,
            whatYouWillLearn,
            price,
            tag: _tag,
            category,
            // status,
            instructions: _instructions,
        } = req.body

        // get thumbnail
        const thumbnail = req.files.thumbnailImage;

        // Convert the tag and instructions from stringified Array to Array
        const tag = _tag ? JSON.parse(_tag) : [];
        const instructions = _instructions ? JSON.parse(_instructions) : [];


        // validation
        if (!courseName || !courseDescription || !whatYouWillLearn || !price || !category || !thumbnail) {
            return res.status(400).json({
                success: false,
                message: "All fileds are required",
            });
        };

        // if (!status || status === undefined) {
        //     status = "Draft"
        // }

        // course model main instructor ke detials store kar rahe 
        // check for instructor
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId);
        console.log("Instructor Details: ", instructorDetails);

        // ONE DOUBT USER.ID IS EQUAL TO INSTRUCTOR._ID SO JUST CHECK IT
        console.log(typeof userId); // string
        console.log(typeof instructorDetails._id); // object (ObjectId)
        console.log(instructorDetails._id === req.user.id); // false (strict equality)
        console.log(instructorDetails._id.equals(req.user.id)) // ✅ true

        if (!instructorDetails) {
            return res.status(404).json({
                success: false,
                message: 'Insrtuctor Details not found',
            });
        };

        // check given tag is valid or not
        const categoryDetails = await Category.findById(category);

        if (!categoryDetails) {
            return res.status(404).json({
                success: false,
                message: "Category Details not found"
            });
        }

        // Upload Image top cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        // create an entry for new course 
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn,
            price,
            tag,
            category: categoryDetails._id,
            thumbnail: thumbnailImage.secure_url,
            // status: status,
            instructions,
        });

        // user update karo
        // add the new course to the user schema 
        await User.findByIdAndUpdate(
            { _id: instructorDetails._id },
            {
                $push: {
                    courses: newCourse._id,
                }
            },
            { new: true }
        );

        // now siimilarly updat the tag schema
        await Category.findByIdAndUpdate(
            { _id: categoryDetails._id },
            {
                $push: {
                    courses: newCourse._id,
                }
            },
            { new: true }
        );

        // return response
        return res.status(200).json({
            success: true,
            message: "Course Created Successfully",
            data: newCourse,
        });


    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: true,
            message: error.message
        });
    };
};

// get all courses handler functiion
exports.showAllCourses = async (req, res) => {
    try {
        const allCourses = await Course.find({},
            // {status: "Published"},
            {
                courseName: true,
                price: true,
                thumbnail: true,
                instructor: true,
                ratingAndReviews: true,
                studentsEnrolled: true,
            }
        )
            .populate("instructor")
            .exec();

        return res.status(200).json({
            success: true,
            message: 'Data for all courses fetched successfully',
            data: allCourses
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot Fetch course data",
            error: error.message,
        });
    };
};

// getCourseDetails of specific one
exports.getCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body
        const courseDetails = await Course.findOne({
            _id: courseId,
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                    select: "-videoUrl",
                },
            })
            .exec()

        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find course with id: ${courseId}`,
            })
        }

        // if (courseDetails.status === "Draft") {
        //   return res.status(403).json({
        //     success: false,
        //     message: `Accessing a draft course is forbidden`,
        //   });
        // }

        let totalDurationInSeconds = 0
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
            },
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// get full course Details for include how many number of vedios are completed
exports.getFullCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body
        const userId = req.user.id
        const courseDetails = await Course.findOne({
            _id: courseId,
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            })
            .exec()

        let courseProgressCount = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId,
        })

        console.log("courseProgressCount : ", courseProgressCount)

        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find course with id: ${courseId}`,
            })
        }

        let totalDurationInSeconds = 0
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
                completedVideos: courseProgressCount?.completedVideos
                    ? courseProgressCount?.completedVideos
                    : [],
            },
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// now get the courses created by particular instructpr
exports.getInstructorCourses = async (req, res) => {
    try {
        const instructorId = req.user.id;

        // validation
        if (!instructorId) {
            return res.status(400).json({
                success: false,
                message: "Error in getting the instructor Id",
            })
        }

        // find all courses belonging to the instructor
        const instructorCourses = await Course.find({
            instructor: instructorId,
        }).sort({ createdAt: -1 });

        console.log(instructorCourses);
        return res.status(200).json({
            success: true,
            message: "Get the Instructor courses",
            data: instructorCourses,
        })
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve instructor courses",
            error: error.message,
        })
    }
}

// now to edit the course details
exports.editCourse = async (req, res) => {
    try {
        // get data
        const { courseId } = req.body;
        const updates = req.body;

        // validation
        if (!courseId || !updates) {
            return res.status(400).json({
                success: false,
                message: "Could not get the courseId and require updates"
            });
        };

        // fetch the original course data
        const course = await Course.findById(courseId);

        // validation of course data
        if (!course) {
            return res.status(400).json({
                success: false,
                message: "Could not find teh course with given courseId"
            });
        };

        // check if the req.files content anything 
        // if yeas the upload it to the cloudinary
        if (req.files) {
            console.log("thumbnail update");
            const thumbnail = req.files.thumbnailImage;
            const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

            // UPDATE THE IMAGE FROMT THE FETCH COURSE
            course.thumbnail = thumbnailImage.secure_url;
        }

        // now the update the fields that are passed though the update from re.body
        for (const [key, value] of Object.entries(updates)) {
            if (key === "tag" || key === "instructions") {
                course[key] = JSON.parse(value);
            } else if (key !== "courseId") {
                course[key] = value;
            }
        }

        await course.save();

        // console.log whole course details
        const updatedCourse = await Course.findOne({
            _id: courseId,
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                }
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            })
            .exec();
        return res.status(200).json({
            success: true,
            message: "Course updated Successfully",
            data: updatedCourse,
        })

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Could not Edit the details of the course",
            error: error.message,
        });
    };
};

exports.deleteCourse = async (req, res) => {
    try {
        // get course id
        const { courseId } = req.body;

        // validation of courseId
        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Could not get the course ID to delete",
                error: error.message,
            });
        };

        // get the course
        const course = await Course.findById(courseId);

        // check the validation of course
        if (!course) {
            return res.status(400).json({
                success: false,
                message: "Could not find the Couse of that Course ID"
            });
        };

        // Instructor ke courses main se course hatao
        // for tehse get the instructor id
        const instructorId = course.instructor;
        const instructorDetails = await User.findByIdAndUpdate(
            instructorId,
            {
                $pull: { courses: courseId }
            },
            { new: true }
        );

        console.log("Instructor User details: ", instructorDetails);


        // unenroll students from the courses
        const studentsEnrolled = course.studentEnrolled;
        for (const studentId of studentsEnrolled) {
            await User.findByIdAndUpdate(studentId, {
                $pull: { courses: courseId },
            })
        }

        // course content hatao -> section
        const courseSections = course.courseContent
        for (const sectionId of courseSections) {
            // Delete sub-sections of the section
            const section = await Section.findById(sectionId)
            if (section) {
                const subSections = section.subSection
                for (const subSectionId of subSections) {
                    await SubSection.findByIdAndDelete(subSectionId)
                }
            }

            // Delete the section
            await Section.findByIdAndDelete(sectionId)
        }

        // remove the reviews and ratings of that courses
        const courseRatingAndReviews = course.ratingAndReviews;
        for (const ratingId of courseRatingAndReviews) {
            await RatingAndReview.findByIdAndDelete(ratingId);
        }

        // remove the course from the category also
        const courseCategory = course.category;
        await Category.findByIdAndDelete(courseCategory);

        // remove the course from the DB
        await Course.findByIdAndDelete(courseId);

        return res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Could not delete the course",
            error: error.message,
        })
    }
}