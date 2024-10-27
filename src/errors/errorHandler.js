// errorHandler.js

import { HTTP_STATUS } from '../../constants.js'; // Adjust the path if needed

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
    // Determine the status code
    const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

    // Default error message
    let message = err.message || "An unexpected error occurred";

    // Customize error message for specific cases
    if (statusCode === HTTP_STATUS.BAD_REQUEST) {
        message = "Bad request: " + message;
    } else if (statusCode === HTTP_STATUS.NOT_FOUND) {
        message = "Not found: " + message;
    } else if (statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
        message = "Internal server error: " + message;
    }
    // Send response
    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Show stack trace in development
    });
};

export default errorHandler;
