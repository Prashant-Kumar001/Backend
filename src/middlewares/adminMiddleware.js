import User from '../models/User_model.js';
import { HTTP_STATUS } from '../../constants.js';
import { sendApiResponse } from '../utility/apiResponse_utility.js'; // Import the apiResponse utility

// Middleware to check if the user is an admin
export const isAdmin = async (req, res, next) => {
    try {
        const checkUser = await User.findById(req.user.userId);
        if (checkUser && checkUser.role === 'admin' && req.user.role === 'admin') {
            next(); // User is an admin, continue to the next middleware
        } else {
            return sendApiResponse(res, HTTP_STATUS.FORBIDDEN, false, 'Access denied. Admins only.');
        }
    } catch (error) {
        console.error(error); // Log the error for debugging
        return sendApiResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, 'Internal server error.');
    }
};
