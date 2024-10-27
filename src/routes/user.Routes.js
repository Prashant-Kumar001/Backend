// Import dependencies
import express from 'express';

// Import middleware for handling file uploads
import upload from '../middlewares/uploadMiddleware.js';

// Import controller for handling file uploads
import { handleUpload } from '../controllers/upload_Controller.js';

// Import controller functions for user operations
import {
    createUser,
    loginUser,
    getUserById,
    updateUserById,
    deleteUserById,
} from '../controllers/user_Controller.js'; // Adjust the path as needed

// Initialize the router
const router = express.Router();

// Define routes for user operations
// POST: Create a new user (signup)
router.post('/signup', upload.fields([
    {
        name: 'avatar',
        maxCount: 1
    },
    {
        name: 'coverImage',
        maxCount: 1
    }
]), createUser);

// POST: Login an existing user
router.post('/login', loginUser);

// GET: Retrieve a single user by ID
router.get('/:id', getUserById);

// PUT: Update a user's information by ID
router.put('/:id', updateUserById);

// DELETE: Remove a user by ID
router.delete('/:id', deleteUserById);

// Export the router for use in other modules
export default router;
