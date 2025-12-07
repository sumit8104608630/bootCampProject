// Import Cloudinary API and File System module
import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import dotenv from "dotenv"
dotenv.config({path:"./.env"})

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME, // Cloudinary cloud name from environment variables
    api_key: process.env.API_KEY,       // Cloudinary API key from environment variables
    api_secret: process.env.API_SECRET  // Cloudinary API secret from environment variables
});

// Function to upload file to Cloudinary
const uploadFile = async (localStorage) => {
    try {
        // Check if local file path is provided
        if (!localStorage) {
            return "Please provide a valid file path.";
        }
 
        // Upload file to Cloudinary
        const uploaded = await cloudinary.uploader.upload(localStorage, { resource_type: "auto" , folder: "study_buddy/profilePhoto"});
 

        // Delete the local file after successful upload
        fs.unlinkSync(localStorage);

        return uploaded;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);

        // Ensure file is deleted even if upload fails
        if (fs.existsSync(localStorage)) {
            fs.unlinkSync(localStorage);
            console.log("Local file deleted due to upload error.");
        }

        return { error: "Upload failed. Please try again." }; // ✅ Return error message
    }
};

const uploadImageFile = async (localStorage) => {
    try {
        // Check if local file path is provided
        if (!localStorage) {
            return "Please provide a valid file path.";
        }
 
        // Upload file to Cloudinary
        const uploaded = await cloudinary.uploader.upload(localStorage, { resource_type: "auto" , folder: "study_buddy/images"});
 

        // Delete the local file after successful upload
        fs.unlinkSync(localStorage);

        return uploaded;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);

        // Ensure file is deleted even if upload fails
        if (fs.existsSync(localStorage)) {
            fs.unlinkSync(localStorage);
            console.log("Local file deleted due to upload error.");
        }

        return { error: "Upload failed. Please try again." }; // ✅ Return error message
    }
};

const uploadDocFiles = async (localStoragePaths) => {
    try {
        if (!localStoragePaths || !Array.isArray(localStoragePaths) || localStoragePaths.length === 0) {
            return { error: "Please provide a valid array of file paths." };
        }

        // Upload all files in parallel
        const uploadPromises = localStoragePaths.map(async (filePath) => {
            try {
                if (!fs.existsSync(filePath)) {
                    throw new Error("File not found");
                }

                const uploaded = await cloudinary.uploader.upload(filePath, { 
                    resource_type: "auto",
                    folder: "study_buddy/documents"
                });

                // Delete local file after upload
                fs.unlinkSync(filePath);

                return {
                    success: true,
                    originalPath: filePath,
                    cloudinaryUrl: uploaded.secure_url,
                    publicId: uploaded.public_id
                };
            } catch (error) {
                // Clean up file on error
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                
                return {
                    success: false,
                    originalPath: filePath,
                    error: error.message
                };
            }
        });

        const results = await Promise.all(uploadPromises);
        
        const uploaded = results.filter(r => r.success);
        const errors = results.filter(r => !r.success);

        return {
            success: uploaded.length > 0,
            uploaded,
            errors: errors.length > 0 ? errors : undefined,
            summary: {
                total: localStoragePaths.length,
                successful: uploaded.length,
                failed: errors.length
            }
        };

    } catch (error) {
        console.error("Upload Process Error:", error);
        return { error: "Upload process failed. Please try again." };
    }
};

const uploadVideoFile = async (localStorage) => {
    try {
        // Check if local file path is provided
        if (!localStorage) {
            return "Please provide a valid file path.";
        }
 
        // Upload file to Cloudinary
        const uploaded = await cloudinary.uploader.upload(localStorage, { resource_type: "auto" , folder: "study_buddy/videos"});
 

        // Delete the local file after successful upload
        fs.unlinkSync(localStorage);

        return uploaded;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);

        // Ensure file is deleted even if upload fails
        if (fs.existsSync(localStorage)) {
            fs.unlinkSync(localStorage);
            console.log("Local file deleted due to upload error.");
        }

        return { error: "Upload failed. Please try again." }; // ✅ Return error message
    }
};

const uploadGroupImageFile = async (localStorage) => {
    try {
        // Check if local file path is provided
        if (!localStorage) {
            return "Please provide a valid file path.";
        }
 
        // Upload file to Cloudinary
        const uploaded = await cloudinary.uploader.upload(localStorage, { resource_type: "auto" , folder: "study_buddy/GroupProfileImages"});
 

        // Delete the local file after successful upload
        fs.unlinkSync(localStorage);

        return uploaded;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);

        // Ensure file is deleted even if upload fails
        if (fs.existsSync(localStorage)) {
            fs.unlinkSync(localStorage);
            console.log("Local file deleted due to upload error.");
        }

        return { error: "Upload failed. Please try again." }; // ✅ Return error message
    }
};
export { uploadFile,uploadImageFile,uploadDocFiles,uploadVideoFile ,uploadGroupImageFile};