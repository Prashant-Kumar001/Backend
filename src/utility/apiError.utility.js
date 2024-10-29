// utils/apiError.js

export default function sendApiError(res, statusCode, message, details = null) {
    const errorResponse = {
        success: false,
        message,
        statusCode,
        details, // Optional: include additional error details
    };

    // Set default status code if none provided
    statusCode = statusCode || 500;

    // Send the error response
    return res.status(statusCode).json(errorResponse);
}
