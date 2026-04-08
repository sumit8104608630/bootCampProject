import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

// Helper: upload buffer to cloudinary
const uploadBuffer = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto", folder },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

const uploadFile = async (buffer) => {
    try {
        if (!buffer) return { error: "Please provide a valid file." };
        return await uploadBuffer(buffer, "study_buddy/profilePhoto");
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return { error: "Upload failed. Please try again." };
    }
};

const uploadImageFile = async (buffer) => {
    try {
        if (!buffer) return { error: "Please provide a valid file." };
        return await uploadBuffer(buffer, "study_buddy/images");
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return { error: "Upload failed. Please try again." };
    }
};

const uploadDocFiles = async (buffers) => {
    try {
        if (!buffers || !Array.isArray(buffers) || buffers.length === 0) {
            return { error: "Please provide a valid array of file buffers." };
        }

        const uploadPromises = buffers.map(async (buffer, index) => {
            try {
                const uploaded = await uploadBuffer(buffer, "study_buddy/documents");
                return {
                    success: true,
                    index,
                    cloudinaryUrl: uploaded.secure_url,
                    publicId: uploaded.public_id
                };
            } catch (error) {
                return { success: false, index, error: error.message };
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
                total: buffers.length,
                successful: uploaded.length,
                failed: errors.length
            }
        };
    } catch (error) {
        console.error("Upload Process Error:", error);
        return { error: "Upload process failed. Please try again." };
    }
};

const uploadVideoFile = async (buffer) => {
    try {
        if (!buffer) return { error: "Please provide a valid file." };
        return await uploadBuffer(buffer, "study_buddy/videos");
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return { error: "Upload failed. Please try again." };
    }
};

const uploadGroupImageFile = async (buffer) => {
    try {
        if (!buffer) return { error: "Please provide a valid file." };
        return await uploadBuffer(buffer, "study_buddy/GroupProfileImages");
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return { error: "Upload failed. Please try again." };
    }
};

export { uploadBuffer, uploadFile, uploadImageFile, uploadDocFiles, uploadVideoFile, uploadGroupImageFile };