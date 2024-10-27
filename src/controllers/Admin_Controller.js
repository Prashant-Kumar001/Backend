import User from "../models/User_model.js";
import { HTTP_STATUS } from '../../constants.js'; // Import constants
import asyncHandler from '../utility/async_Handler.js'; // Import async handler

// Controller to create a new user


// Controller to get all users // only for admin
export const getAllUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find({});
    res.status(HTTP_STATUS.OK).json(users);
});
