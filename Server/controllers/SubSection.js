const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const Course = require("../models/Course");
const {uploadImageToCloudinary} = require("../utils/imageUploader");

// create SubSection
exports.createSubSection = async (req, res) => {
    try {
        // fetch data from Req body
        const {sectionId, title, timeDuration, description, courseId} = req.body;

        // extract file/vedio
        const video = req.files.videoFile;

        // validation
        if(!sectionId || !title || !description || !video) {
            return res.status(400).json({
                success: false,
                message: "All fields are required", 
            });
        };

        // upload vedio to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);

        // create a subsection
        const SubSectionDetails = await SubSection.create({
            title,
            timeDuration,
            description,
            videoUrl: uploadDetails.secure_url,
        });

        // update section with these subsection id 
        const updateSection = await Section.findByIdAndUpdate(
            {_id: sectionId},
            {
                $push: {
                    subSection: SubSectionDetails._id,      
                }
            },
            {new: true},
        )

        // TODO: CONSOLE LOG THESE ASLO THAT YOU HAVE CORRECTED THE POPULATION FEATURE
        const sectionDetails = await Section.findById(sectionId).populate("subSection").exec();
        console.log(sectionDetails);

        const updatedCourse = await Course.findById(courseId)
                                            .populate(
                                                {
                                                    path: "courseContent", 
                                                    populate: { 
                                                        path: "subSection" 
                                                    }
                                                
                                                }
                                            )
                                            .exec();

        // return response
        return res.status(200).json({
            success: true,
            message: "Sub Section Created Successfully",
            data: updatedCourse,
        });
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server error",
        })
    };
};

// update subsection
exports.updateSubSection = async (req, res) => {
  try {
		// Extract necessary information from the request body
		const { SubsectionId, title , description,courseId } = req.body;
		const video = req?.files?.videoFile;

		
		let uploadDetails = null;
		// Upload the video file to Cloudinary
		if(video){
		 uploadDetails = await uploadImageToCloudinary(
			video,
			process.env.FOLDER_VIDEO
		);
		}

		// Create a new sub-section with the necessary information
		const SubSectionDetails = await SubSection.findByIdAndUpdate({_id:SubsectionId},{
			title: title || SubSection.title,
			timeDuration: timeDuration,
			description: description || SubSection.description,
			videoUrl: uploadDetails?.secure_url || SubSection.videoUrl,
		},{ new: true });

		
		const updatedCourse = await Course.findById(courseId).populate({ path: "courseContent", populate: { path: "subSection" } }).exec();
		// Return the updated section in the response
		return res.status(200).json({ success: true, data: updatedCourse });
	} catch (error) {
		// Handle any errors that may occur during the process
		console.error("Error creating new sub-section:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}
}

// delete subsection
exports.deleteSubSection = async (req, res) => {
    try {
        // get data
        const {subSectionId, sectionId, courseId} = req.body;

        // validation
        if(!subSectionId || !sectionId || !courseId) {
            return res.status(401).json({
                success: false,
                message: "All fields are required, Something is Missing!!",
            });
        }

        const subSection = await SubSection.findById(subSectionId);
        const section = await Section.findById(sectionId);

        // check subsection is present or not
        if(!subSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            });
        };

        // check section is present or not
        if(!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found",
            });
        };

        // delete the subsection
        await SubSection.findByIdAndDelete(subSectionId);
        
        // update section by deleting the subsection array
        await Section.findByIdAndUpdate(
            sectionId,
            {
                $pull: {
                    subSection: subSectionId
                }
            },
            { new: true },
        );

        // create the whole course data
        const updatedCourse = await Course.findById(courseId)
                                            .populate(
                                                {
                                                    path: "courseContent", 
                                                    populate: { 
                                                        path: "subSection" 
                                                    }
                                                
                                                }
                                            )
                                            .exec();

        // return response
        return res.status(200).json({
            success: true,
            message: "Sub Section Deleted Successfully",
            data: updatedCourse,
        });
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot Delete the Subsection, Error occurred!!"
        });
    };
};