import fs from 'fs';
import cloudinary from '../config/cloudinaryConfig.js';

// Upload a file to Cloudinary
export const uploadFileToCloudinary = async (filePath) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            // Additional options for Cloudinary
            folder: 'uploaded_files', // Specify the folder to save the file
            public_id: Date.now().toString(), // Generate a unique public ID for the file
        });
        return result; // Return the result from Cloudinary
    } catch (error) {
        removeLocalFile(filePath);
        // Handle and throw the error with a custom message
        const errorMessage = Error(`Cloudinary upload error: ${error.message}`);
        errorMessage.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
        throw errorMessage;
    }
};

// Remove a local file after uploading
export const removeLocalFile = (filePath) => {
    try {
        fs.unlinkSync(filePath); // Synchronously remove the file
    } catch (error) {
        // Log the error if the file removal fails
        console.error(`Error removing file: ${error.message}`);
    }
};

