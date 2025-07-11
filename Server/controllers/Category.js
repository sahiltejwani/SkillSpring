const Category = require("../models/Category");
const mongoose = require("mongoose");

// create Tag ka handler function
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // validation
        if(!name || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        };

        // create exntry in DB
        const categoryDetails = await Category.create({
            name: name,
            description: description
        });
        console.log(categoryDetails);

        return res.status(200).json({
            success: true,
            message: "Category created successfully",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    };
};

//  get all tags handler function
exports.showAllCategories = async (req, res) => {
    try {
        console.log("INSIDE SHOW ALL CATEGORIES");
        const allCategories = await Category.find({}, {name: true, description: true});
        // these make sure that it must contains name and description
        
        res.status(200).json({
            success: true,
            error: "All categories returned successfully",
            data: allCategories
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    };
};

// category page details
exports.categoryPageDetails = async (req, res) => {
    try {
        // get category id
        const {categoryId} = req.body;

        // get courses for specified category Id
        const selectedCategory = await Category.findById(categoryId)
                                                .populate({
                                                    path: "courses",
                                                    // match: { status: "Published" },
                                                    populate: "ratingAndReviews",
                                                })
                                                .exec();
        
        // validation
        if(!selectedCategory) {
            return res.status(404).json({
                success: false,
                message: 'Data not Found',
            })
        };

        // get courses for different categories
        const differentCategories = await Category.find({
                                                _id: {$ne: categoryId},
                                            })
                                            .populate("courses")
                                            .exec();
        
        // get top selling courses
        const allCategories = await Category.find()
                                            .populate({
                                                path: "courses",
                                                populate: {
                                                    path: "instructor",
                                                },
                                            })
                                            .exec();

        const allCourses = allCategories.flatMap((category) => category.courses)
        
        const mostSellingCourses = allCourses
                                        .sort((a, b) => b.sold - a.sold)
                                        .slice(0, 10);

        // return response
        return res.status(200).json({
            success: true,
            data: {
                selectedCategory,
                differentCategories,
                mostSellingCourses
            },
        });
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    };
};