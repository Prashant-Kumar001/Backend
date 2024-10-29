// Import dependencies
import express from 'express';

// Import middleware for handling file uploads
import upload from '../middlewares/uploadMiddleware.js';

// Import middleware for authentication
import { authenticateToken } from '../middlewares/authMiddleware.js';

// Import controller for handling file uploads
import { handleUpload } from '../controllers/upload_Controller.js';

// Import controller functions for user operations
import {
  createUser,
  loginUser,
  getUserById,
  updateAccountDetails,
  deleteUserById,
  loggedOut, // Add this route if you want to implement a logged out functionality
  changeCurrentUserPassword, // using for changes to the current user password
  getCurrentUser, // Get current user
  changeCurrentUserAvatar, // Change the current user avatar to the specified
  changeCurrentUserCoverImage, // Change the current user cover image to the specified
  refreshAccessToken, // Add this route if you want to implement token refresh functionality
} from '../controllers/user_Controller.js'; // Adjust the path as needed

// Initialize the router
const router = express.Router();

// Define routes for user operations
// POST: Create a new user (signup)
router.post(
  '/signup',
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    },
  ]),
  createUser
);

// POST: Login an existing user
router.post('/login', loginUser);

router.post('/logout', authenticateToken, loggedOut);

router.post('/refresh-token', refreshAccessToken);

router.patch('/passwordChange', authenticateToken, changeCurrentUserPassword)

// GET: Retrieve the current user's information
router.get('/current', authenticateToken, getCurrentUser);

// PUT: Change the current user's avatar to the specified
router.put('/avatar', authenticateToken, upload.single('avatar'), changeCurrentUserAvatar);

// PUT: Change the current user's cover image to the specified
router.put('/coverImage', authenticateToken, upload.single('coverImage'), changeCurrentUserCoverImage);

// GET: Retrieve a single user by ID
router.get('/:id', getUserById);

// PUT: Update a user's information by ID
router.put('/update', authenticateToken, updateAccountDetails);

// DELETE: Remove a user by ID
router.delete('/:id', deleteUserById);

// post logged out

// Export the router for use in other modules
export default router;
