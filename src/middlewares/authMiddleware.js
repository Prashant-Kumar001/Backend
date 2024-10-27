import jwt from 'jsonwebtoken';
import User from '../models/User_model.js';
import { HTTP_STATUS } from '../../constants.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();


// Middleware to verify the user is authenticated
export const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Invalid or expired token.' });
        }
        

        req.user = user;
        next();
    });
};
