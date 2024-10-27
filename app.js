import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import userRoutes from './src/routes/user.Routes.js';
import fileRouter from './src/routes/file.Routes.js';
import adminRoutes from './src/routes/admin.Routes.js';
import errorHandler from './src/errors/errorHandler.js';
import { authenticateToken } from './src/middlewares/authMiddleware.js';
import { isAdmin } from './src/middlewares/adminMiddleware.js';

dotenv.config();

const app = express();

// Middleware Setup
const setupMiddleware = () => {
    app.use(express.static(path.resolve("./public")));
    app.use(express.json({ limit: '16kb' }));
    app.use(express.urlencoded({ extended: true, limit: '16kb' }));
    app.use(cookieParser());
    app.use(helmet({
        contentSecurityPolicy: process.env.NODE_ENV === 'production',
    }));
    
    app.use(cors({
        origin: process.env.CLIENT_URL || '*',
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Custom-Header'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }));
    
    if (process.env.NODE_ENV === 'development') {
        app.use(morgan('dev'));
    } else {
        app.use(morgan('combined'));
    }

    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: "Too many requests from this IP, please try again later.",
    });
    app.use('/api', apiLimiter);
};

// Route Setup with Versioned Base URL
const setupRoutes = () => {
    const baseApiUrl = '/api/v1';

    app.use(`${baseApiUrl}/img`, fileRouter);
    app.use(`${baseApiUrl}/admin`, authenticateToken, isAdmin, adminRoutes);
    app.use(`${baseApiUrl}/users`, userRoutes);
};

// Error Handling
const setupErrorHandling = () => {
    app.use(errorHandler);
};

// Initialize the server
setupMiddleware();
setupRoutes();
setupErrorHandling();

export default app;
