const cloudinary = require('cloudinary').v2;

exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
    try {
        const options = {
            folder,
            use_filename: true,
            unique_filename: false,
        };

        if(height) {
            options.height = height;
        }
        if(quality) {
            options.quality = quality;
        }

        options.resource_type = "auto";

        return await cloudinary.uploader.upload(file.tempFilePath, options);
    }
    catch(error) {
        console.log(error);
    };
};