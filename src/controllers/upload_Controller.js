import { uploadFileToCloudinary, removeLocalFile } from '../utility/uploadUtils.js';
import { HTTP_STATUS } from '../../constants.js'; // Import constants
import asyncHandler from '../utility/async_Handler.js'; // Import async handler

// Handle file upload
export const handleUpload = asyncHandler(async (req, res, next) => {
    // Check if a file is uploaded
    if (!req.file) {
        const error = new Error('No file uploaded.');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        return next(error);
        // return res.status(HTTP_STATUS.BAD_REQUEST).send('No file uploaded.');
    }

    const filePath = req.file.path; // Get the file path from req.file

    // Upload the file to Cloudinary
    const result = await uploadFileToCloudinary(filePath);
    
    if (!result) {
        const error = new Error('File upload failed.');
        error.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
        return next(error);
    }

    // Remove the local file after successful upload
    removeLocalFile(filePath);

    // Send success response with result from Cloudinary
    res.status(HTTP_STATUS.OK).send({
        success: true,
        message: 'File uploaded successfully!',
        result,
    });
});
