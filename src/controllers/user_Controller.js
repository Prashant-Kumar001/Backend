import User from '../models/User_model.js'; // Adjust the path if needed
import { validateUser } from '../validations/userValidation.js'; // Import validation function
import { HTTP_STATUS } from '../../constants.js'; // Import constants
import asyncHandler from '../utility/async_Handler.js'; // Import async handler
import cookieParser from 'cookie-parser';


// Controller to create a new user (sighup)
export const createUser = asyncHandler(async (req, res, next) => {
    const { username, email, fullName, password, avatar, coverImage } = req.body;
        console.log('user data', req.body)
        console.log('user file', req.files)
    // Validate user data
    const { error } = validateUser(req.body);
    if (error) {
        console.log(error)
        const validationErrors = error.details.map(err => err.message);
        const errorMessage = validationErrors.join(', ');
        const validationError = new Error(errorMessage);
        validationError.statusCode = HTTP_STATUS.BAD_REQUEST;
        return next(validationError);
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        const error = new Error(`Username "${username}" is already taken. Please choose another one.`);
        error.statusCode = HTTP_STATUS.BAD_REQUEST; // 400
        return next(error);
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        const error = new Error(`Email "${email}" is already in use. Please use a different email.`);
        error.statusCode = HTTP_STATUS.BAD_REQUEST; // 400
        return next(error);
    }

    // Create the user
    const newUser = new User({
        username,
        email,
        password,
        fullName,
        avatar,
        coverImage,
        resetToken: null, // Initially null
        resetTokenExpiry: null, // Initially null
        lastLogin: null, // Initially null
        loginAttempts: 0, // Starts at 0
        lastLoginIP: null, // Initially null
        userAgent: null // Initially null
    });


    const savedUser = await newUser.save();

    // Generate refresh token and update the user
    const refreshToken = newUser.generateRefreshToken();
    savedUser.refreshToken = refreshToken;
    await savedUser.save();

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        user: {
            _id: savedUser._id,
            username: savedUser.username,
            email: savedUser.email,
            fullName: savedUser.fullName,
            avatar: savedUser.avatar,
            coverImage: savedUser.coverImage,
            refreshToken: refreshToken // Optionally return the refresh token
        }
    });
});

//Controller to User Login
export const loginUser = asyncHandler(async (req, res, next) => {
    const { username, password } = req.body;

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
        const error = new Error('Invalid username or password.');
        error.statusCode = HTTP_STATUS.UNAUTHORIZED; // 401
        return next(error);
    }

    // Check the password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        // Increment login attempts
        user.loginAttempts += 1;
        await user.save();
        
        const error = new Error('Invalid username or password.');
        error.statusCode = HTTP_STATUS.UNAUTHORIZED; // 401
        return next(error);
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lastLogin = new Date(); // Set the last login date
    user.lastLoginIP = req.ip; // Store the last login IP
    user.userAgent = req.headers['user-agent']; // Store user agent
    await user.save(); // Save user updates

    // Generate tokens
    const accessToken = user.generateAccessToken();
    // const refreshToken = user.generateRefreshToken();
    // user.refreshToken = refreshToken; // Update refresh token
    // await user.save();
    
    // Set refresh token as a cookie
    res.cookie('accessToken', accessToken, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true
    });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        accessToken,
        user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            avatar: user.avatar,
            coverImage: user.coverImage,
        }
    });
});

// Controller to get a single user by ID
export const getUserById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
        const error = new Error("User not found.");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        return next(error);
    }
    res.status(HTTP_STATUS.OK).json(user);
});

// Controller to update a user by ID
export const updateUserById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { username, email, password } = req.body;
    // Validate user data
    const { error } = validateUser(req.body);
    if (error) {
        const validationError = new Error(error.details.map(err => err.message).join(', '));
        validationError.statusCode = HTTP_STATUS.BAD_REQUEST;
        return next(validationError);
    }
    const updatedUser = await User.findByIdAndUpdate(id, { username, email, password }, { new: true });
    if (!updatedUser) {
        const error = new Error("User not found.");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        return next(error);
    }
    res.status(HTTP_STATUS.OK).json(updatedUser);
});

// Controller to delete a user by ID
export const deleteUserById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
        const error = new Error("User not found.");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        return next(error);
    }
    res.status(HTTP_STATUS.NO_CONTENT).json({
        success: true,
        message: "User deleted successfully.",
    }); // No content response
});
