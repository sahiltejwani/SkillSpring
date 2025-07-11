const express = require("express")
const router = express.Router()

const {
    createCourse,
    showAllCourses,
    getFullCourseDetails,
    getCourseDetails,
    editCourse,
    getInstructorCourses,
    deleteCourse,
} = require("../controllers/Course");

const { 
    createSection, 
    updateSection, 
    deleteSection
} = require("../controllers/Section");

const {
    updateSubSection,
    deleteSubSection,
    createSubSection
} = require("../controllers/SubSection");

const {
    updateCourseProgress
} = require("../controllers/courseProgress");

const {
    createCategory,
    showAllCategories,
    categoryPageDetails
} = require("../controllers/Category");

// Import Middleware
const { auth, isInstructor, isStudent, isAdmin } = require("../middlewares/auth");
const { createRating, getAverageRating, getAllRating } = require("../controllers/RatingAndReview");

// Course routes
router.post("/createCourse", auth, isInstructor, createCourse);
router.post("/addSection", auth, isInstructor, createSection);
router.post("/updateSection", auth, isInstructor, updateSection);
router.delete("/deleteSection", auth, isInstructor, deleteSection);
router.post("/updateSubSection", auth, isInstructor, updateSubSection);
router.delete("/deleteSubSection", auth, isInstructor, deleteSubSection);
router.post("/addSubSection", auth, isInstructor, createSubSection);
router.get("/getAllCourses", showAllCourses);
router.post("/getCourseDetails", getCourseDetails);
router.post("/getFullCourseDetails", auth, getFullCourseDetails);
router.post("/editCourse", auth, isInstructor, editCourse);
router.get("/getinstructorCourses", auth, isInstructor, getInstructorCourses);
router.delete("/deleteCourse", deleteCourse);
router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress);

router.post("/createCategory", auth, isAdmin, createCategory);
router.get("/showAllCategories", showAllCategories);
router.post("/getCategoryPageDetails", categoryPageDetails);

router.post("/createRating", auth, isStudent, createRating);
router.get("/getAverageRating", getAverageRating);
router.get("/getReviews", getAllRating);

module.exports = router;