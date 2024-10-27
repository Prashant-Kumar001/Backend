import jwt from 'jsonwebtoken';
import { HTTP_STATUS } from '../../constants.js';
import dotenv from 'dotenv';
import { sendApiResponse } from '../utility/apiResponse_utility.js';
import cookieParser from 'cookie-parser';

// Load environment variables from .env file
dotenv.config();

// Middleware to verify the user is authenticated
export const authenticateToken = (req, res, next) => {
    const Token = req.cookies?.accessToken ||  req.headers['authorization']?.split(' ')[1];

    if (!Token) {
        return sendApiResponse(res, HTTP_STATUS.UNAUTHORIZED, false, 'Access denied. No token provided.');
    }

    jwt.verify(Token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return sendApiResponse(res, HTTP_STATUS.FORBIDDEN, false, 'Invalid or expired token.');
        }

        req.user = user;
        next();
    });
};
