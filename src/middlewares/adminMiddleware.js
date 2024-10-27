import User from '../models/User_model.js';
import { HTTP_STATUS } from '../../constants.js';

// Middleware to check if the user is an admin
export const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user && user.role === 'admin' && req.user.role === 'admin') {
            next(); // User is an admin, continue to the next middleware
        } else {
            return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Access denied. Admins only.' });
        }
    } catch (error) {
        console.log(error)
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error.' });
    }
};
