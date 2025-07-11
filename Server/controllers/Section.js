const Section = require("../models/Section");
const Course = require("../models/Course");

exports.createSection = async (req, res) => {
    try {
        // data fetch
        const {sectionName, courseId} = req.body;

        // data validation
        if(!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: 'Missing Properties',
            });
        }

        // create section
        const newSection = await Section.create({sectionName});

        // update in the course that mean add id
        const updatedCourseDetails = await Course.findByIdAndUpdate(
                                            courseId,
                                            {
                                                $push: {
                                                    courseContent: newSection._id,
                                                }
                                            },
                                            {new: true}
        )

        // TODO POPULATE THE AT THE MULTIPLE LEVEL COURSE -> SECTION -. SUBSECTION
        // SO CHECK THESE SYNTAX
        const courseDetails = await Course.findById(courseId)
                                            .populate({
                                                path: "courseContent",
                                                populate: {
                                                path: "subSection",
                                                }
                                            })
                                            .exec();

        // resturn reponse
        return res.status(200).json({
            success: true,
            message: 'Section created successfully',
            data: courseDetails,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to create Section, please try again",
            error: error.message
        })
    };
};

// update
exports.updateSection = async (req, res) => {
    try {
        // data input
        const {sectionName, sectionId, courseId} = req.body;
        // data validation
        if(!sectionName || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "Missing Properties",
            });
        };

        // update data
        const section  = await Section.findByIdAndUpdate(sectionId, {sectionName}, {new: true});
        const courseDetails = await Course.findById(courseId)
                                            .populate({
                                                path: "courseContent",
                                                populate: {
                                                path: "subSection",
                                                }
                                            })
                                            .exec();
        // return res
        return res.status(200).json({
            success: true,
            message: "Seciton Update Successfully",
            data: courseDetails
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to update Section, please try again",
            error: error.message,
        });
    }
};

exports.deleteSection = async (req, res) => {
    try {
        // get Id -- assuming that we are sending Id in params
        const { sectionId, courseId } = req.body;
        
        // use findByIdandDelete
        const section = await Section.findById(sectionId);
        
        if (!section) {
        return res.status(404).json({
            success: false,
            message: "Section not found",
        });
        }

        await Section.findByIdAndDelete(sectionId);


        // TODO: DO WE NEED TO DELETE THE ENTRY FROM TEH COURSE SCHEMA
        await Course.findByIdAndUpdate(courseId, {
                                                    $pull: { courseContent: sectionId },
                                                });        
    
        const updatedCourse = await Course.findById(courseId)
                                        .populate({
                                            path: "courseContent",
                                            populate: {
                                            path: "subSection",
                                            },
                                        })
                                        .exec();
        // return response
        return res.status(200).json({
            success: true,
            message: "Section Deelted Successfully",
            data: updatedCourse
        });
    }
    catch(error) {
        return res.status(500).json({
            success: false,
            message: "Unable to delete Section, please try again",
            error: error.message,
        })
    }
}