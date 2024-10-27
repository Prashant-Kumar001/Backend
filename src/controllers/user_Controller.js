import User from '../models/User_model.js';
import { validateUser } from '../validations/userValidation.js';
import { HTTP_STATUS } from '../../constants.js';
import asyncHandler from '../utility/async_Handler.js';
import cookieParser from 'cookie-parser';
import { uploadFileToCloudinary, removeLocalFile } from '../utility/uploadUtils.js';

// Controller to create a new user (signup)
export const createUser = asyncHandler(async (req, res, next) => {
    const { username, email, fullName, password } = req.body;

    const avatarLocalPath = req.files?.avatar?.[0].path;
    const coverImageFile = req.files?.coverImage?.[0].path;

    // Validate user data
    const { error } = validateUser(req.body);
    if (error) {
        const validationErrors = error.details.map(err => err.message).join(', ');
        return next({
            message: validationErrors,
            statusCode: HTTP_STATUS.BAD_REQUEST,
        });
    }


    // if (error) {
    //     console.log(error);
    //     const validationErrors = error.details.map(err => err.message);
    //     const errorMessage = validationErrors.join(', ');
    //     const validationError = new Error(errorMessage);
    //     validationError.statusCode = HTTP_STATUS.BAD_REQUEST;
    //     return next(validationError);
    //   }



    // Check for existing username or email
    const [existingUser, existingEmail] = await Promise.all([
        User.findOne({ username }),
        User.findOne({ email }),
    ]);
    if (existingUser) {
        return next({
            message: `Username "${username}" is already taken.`,
            statusCode: HTTP_STATUS.BAD_REQUEST,
        });
    }
    if (existingEmail) {
        return next({
            message: `Email "${email}" is already in use.`,
            statusCode: HTTP_STATUS.BAD_REQUEST,
        });
    }

    if (!avatarLocalPath) {
        return next({
            message: 'Please upload an avatar image.',
            statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }

    // Handle file uploads (if any)

    let avatarUrl, coverImageUrl;
    try {
        if (avatarLocalPath) avatarUrl = (await uploadFileToCloudinary(avatarLocalPath)).secure_url;
        if (coverImageFile) coverImageUrl = (await uploadFileToCloudinary(coverImageFile)).secure_url;
    } catch (uploadError) {
        return next({
            message: 'File upload failed.',
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        });
    } finally {
        // Remove local files after Cloudinary upload attempt
        if (avatarLocalPath) removeLocalFile(avatarLocalPath);
        if (coverImageFile) removeLocalFile(coverImageFile);
    }

    if(!avatarUrl){
        return next({
            message: 'Failed to upload avatar.',
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        });
    }
   

    // Create the user
    const newUser = new User({
        username,
        email,
        fullName,
        password,
        avatar: avatarUrl,
        coverImage: coverImageUrl ? coverImageUrl : 'no cover image',
    });

    const savedUser = await newUser.save();

    if(!savedUser){
        return next({
            message: 'Failed to create user.',
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        });
    }

    // Generate refresh token and set it for the user
    // const refreshToken = newUser.generateRefreshToken();
    // savedUser.refreshToken = refreshToken;
    // await savedUser.save();

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        user: {
            _id: savedUser._id,
            username: savedUser.username,
            email: savedUser.email,
            fullName: savedUser.fullName,
            avatar: savedUser.avatar,
            coverImage: savedUser.coverImage,
            // refreshToken:
        },
    });
});

// Controller for User Login
export const loginUser = asyncHandler(async (req, res, next) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
        return next({
            message: 'Invalid username or password.',
            statusCode: HTTP_STATUS.UNAUTHORIZED,
        });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        user.loginAttempts += 1;
        await user.save();

        return next({
            message: 'Invalid username or password.',
            statusCode: HTTP_STATUS.UNAUTHORIZED,
        });
    }

    user.refreshToken = user.generateRefreshToken();
    user.loginAttempts = 0;
    user.lastLogin = new Date();
    user.lastLoginIP = req.ip;
    user.userAgent = req.headers['user-agent'];
    await user.save();

    const accessToken = user.generateAccessToken();
    res.cookie('accessToken', accessToken, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
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
        },
    });
});

// Controller to get a single user by ID
export const getUserById = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next({
            message: 'User not found.',
            statusCode: HTTP_STATUS.NOT_FOUND,
        });
    }
    res.status(HTTP_STATUS.OK).json(user);
});

// Controller to update a user by ID
export const updateUserById = asyncHandler(async (req, res, next) => {
    const { username, email } = req.body;

    const { error } = validateUser(req.body);
    if (error) {
        return next({
            message: error.details.map(err => err.message).join(', '),
            statusCode: HTTP_STATUS.BAD_REQUEST,
        });
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, { username, email }, { new: true });
    if (!updatedUser) {
        return next({
            message: 'User not found.',
            statusCode: HTTP_STATUS.NOT_FOUND,
        });
    }
    res.status(HTTP_STATUS.OK).json(updatedUser);
});

// Controller to delete a user by ID
export const deleteUserById = asyncHandler(async (req, res, next) => {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
        return next({
            message: 'User not found.',
            statusCode: HTTP_STATUS.NOT_FOUND,
        });
    }
    res.status(HTTP_STATUS.NO_CONTENT).json({
        success: true,
        message: 'User deleted successfully.',
    });
});
