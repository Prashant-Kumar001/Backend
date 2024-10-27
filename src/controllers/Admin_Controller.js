import User from "../models/User_model.js";
import { HTTP_STATUS } from '../../constants.js'; // Import constants
import asyncHandler from '../utility/async_Handler.js'; // Import async handler
import { sendApiResponse } from '../utility/apiResponse_utility.js'; // Import the API response utility

// Controller to get all users (only for admin)
export const getAllUsers = asyncHandler(async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password');

        // Sending a structured API response
        return sendApiResponse(res, HTTP_STATUS.OK, true, 'Users retrieved successfully.', users);
    } catch (error) {
        console.error(error); // Log the error for debugging
        return sendApiResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, 'Failed to retrieve users.');
    }
});
