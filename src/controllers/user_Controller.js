import User from '../models/User_model.js';
import { validateUser } from '../validations/userValidation.js';
import { HTTP_STATUS } from '../../constants.js';
import asyncHandler from '../utility/async_Handler.js';
import jwt from 'jsonwebtoken';
import {
  uploadFileToCloudinary,
  removeLocalFile,
} from '../utility/uploadUtils.js';
import { sendApiResponse } from '../utility/apiResponse_utility.js'; // Import sendApiResponse
import sendApiError from '../utility/apiError.utility.js';
import deleteImageFromCloudinary from '../utility/deleteImageFromCloudinary.js';

const removeLocalFileFromServer = async (avatarLocalPath, coverImagePath) => {
  if (avatarLocalPath) {
    await removeLocalFile(avatarLocalPath);
  }
  if (coverImagePath) {
    await removeLocalFile(coverImagePath);
  }
};

// Controller to create a new user (signup)
export const createUser = asyncHandler(async (req, res, next) => {
  const { username, email, fullName, password } = req.body;
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageFile = req.files?.coverImage?.[0]?.path;

  // Validate user data
  const { error } = validateUser(req.body);
  if (error) {
    if (avatarLocalPath || coverImageFile) {
      removeLocalFileFromServer(avatarLocalPath, coverImageFile);
    }
    return sendApiResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      false,
      'Validation failed',
      null,
      error.details.map(err => err.message)
    );
  }

  // Check for existing username or email
  const [existingUser, existingEmail] = await Promise.all([
    User.findOne({ username }),
    User.findOne({ email }),
  ]);
  if (existingUser) {
    if (avatarLocalPath || coverImageFile) {
      removeLocalFileFromServer(avatarLocalPath, coverImageFile);
    }
    return sendApiResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      false,
      `Username "${username}" is already taken.`,
      null,
      ['Username is already taken.']
    );
    // return res.status(HTTP_STATUS.BAD_REQUEST).json(
    //     new sendApiResponse(
    //         res,
    //         HTTP_STATUS.BAD_REQUEST,
    //         false,
    //         `Username "${username}" is already taken.`,
    //         null,
    //         ['Username is already taken.']
    //     )
    // );
  }
  if (existingEmail) {
    if (avatarLocalPath || coverImageFile) {
      removeLocalFileFromServer(avatarLocalPath, coverImageFile);
    }
    return sendApiResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      false,
      `Email "${email}" is already in use.`,
      null,
      ['Email is already in use.']
    );
  }

  if (!avatarLocalPath) {
    if (avatarLocalPath || coverImageFile) {
      removeLocalFileFromServer(avatarLocalPath, coverImageFile);
    }
    return sendApiResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      false,
      'Please upload an avatar image.',
      null,
      ['Please upload an avatar image.']
    );
  }

  // Handle file uploads (if any)
  let avatarUrl, coverImageUrl;
  try {
    if (avatarLocalPath)
      avatarUrl = (await uploadFileToCloudinary(avatarLocalPath)).secure_url;
    if (coverImageFile)
      coverImageUrl = (await uploadFileToCloudinary(coverImageFile)).secure_url;
  } catch (uploadError) {
    return sendApiResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      false,
      'File upload failed.'
    );
  } finally {
    // Remove local files after Cloudinary upload attempt
    if (avatarLocalPath) removeLocalFile(avatarLocalPath);
    if (coverImageFile) removeLocalFile(coverImageFile);
  }

  // Create the user
  const newUser = new User({
    username,
    email,
    fullName,
    password,
    avatar: avatarUrl,
    coverImage: coverImageUrl || 'no cover image',
  });

  const savedUser = await newUser.save();

  if (!savedUser) {
    return sendApiResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      false,
      'Failed to create user.'
    );
  }

  sendApiResponse(res, HTTP_STATUS.CREATED, true, 'User created successfully', {
    _id: savedUser._id,
    username: savedUser.username,
    email: savedUser.email,
    fullName: savedUser.fullName,
    avatar: savedUser.avatar,
    coverImage: savedUser.coverImage,
  });
});

// Controller for User Login
export const loginUser = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!(username || email)) {
    return sendApiResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      false,
      'Username or email is required.',
      null,
      ['Username or email is required.']
    );
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    return sendApiResponse(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      false,
      'Invalid username or password.'
    );
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    user.loginAttempts += 1;
    // if (user.loginAttempts >= 3) {
    //   user.isBlocked = true;
    // }
    await user.save(); // Save the updated login attempts
    return sendApiResponse(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      false,
      'Invalid user credentials.'
    );
  }

  // Reset login attempts and save user details
  user.loginCount += 1;
  user.isLoggedIn = true;
  user.loginAttempts = 0;
  user.lastLogin = new Date();
  user.lastLoginIP = req.ip;
  user.userAgent = req.headers['user-agent'];
  const refreshToken = await user.generateRefreshToken();
  const accessToken = user.generateAccessToken(); // Assuming this function exists
  user.refreshToken = refreshToken; // Assuming this function exists
  await user.save({ validateBeforeSave: false }); // Save all changes to the user

  const loggedInUser = await User.findById({
    _id: user._id,
  }).select('username email fullName avatar coverImage role refreshToken');

  // Set access token in cookies
  res
    .cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https', // Set secure flag based on the request protocol
    })
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https', // Set secure flag based on the request protocol
    });

  // Sending a successful login response
  return sendApiResponse(
    res,
    HTTP_STATUS.OK,
    true,
    'User logged in successfully',
    {
      user: {
        username: loggedInUser.username,
        email: loggedInUser.email,
        fullName: loggedInUser.fullName,
        avatar: loggedInUser.avatar,
        coverImage: loggedInUser.coverImage,
        role: loggedInUser.role,
        refreshToken: loggedInUser.refreshToken,
        accessToken: loggedInUser.accessToken,
      },
    }
  );
});

export const loggedOut = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.userId);
  if (!user) {
    return sendApiResponse(
      res,
      HTTP_STATUS.NOT_FOUND,
      false,
      'User not found.'
    );
  }
  user.isLoggedIn = false;
  user.lastLogout = new Date();
  user.lastLogoutIP = req.ip;
  user.refreshToken = undefined;
  await user.save({ validateBeforeSave: false });
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  return sendApiResponse(
    res,
    HTTP_STATUS.OK,
    true,
    'User logged out successfully'
  );
});

// Controller to get a single user by ID
export const getUserById = asyncHandler(async (req, res, next) => {
  // Find user by ID and select specific fields
  const user = await User.findById(req.params.id).select(
    'username email fullName avatar coverImage role'
  );

  if (!user) {
    return sendApiResponse(
      res,
      HTTP_STATUS.NOT_FOUND,
      false,
      'User not found.'
    );
  }

  // Sending the selected user fields in the response
  sendApiResponse(res, HTTP_STATUS.OK, true, 'User found successfully', user);
});

// Controller to delete a user by ID
export const deleteUserById = asyncHandler(async (req, res, next) => {
  const deletedUser = await User.findByIdAndDelete(req.params.id);
  if (!deletedUser) {
    return sendApiResponse(
      res,
      HTTP_STATUS.NOT_FOUND,
      false,
      'User not found.'
    );
  }

  sendApiResponse(
    res,
    HTTP_STATUS.NO_CONTENT,
    true,
    'User deleted successfully'
  );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    return sendApiResponse(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      false,
      'No refresh token provided.'
    );
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET
    );
    if (!decodedToken) {
      return sendApiResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        false,
        'Invalid or expired refresh token.'
      );
    }
    const user = await User.findById(decodedToken?.userId);
    if (!user) {
      return sendApiResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        false,
        'Invalid or expired refresh token or maybe user not logged in.'
      );
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      return sendApiResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        false,
        'Invalid or expired refresh token.'
      );
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
    });
    user.refreshToken = refreshToken; // Assuming this function exists
    await user.save({ validateBeforeSave: false }); // Save all changes to the user

    sendApiResponse(
      res,
      HTTP_STATUS.OK,
      true,
      'Access token refreshed successfully',
      {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: {
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
          coverImage: user.coverImage,
          role: user.role,
        },
      }
    );
  } catch (error) {
    return sendApiResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      false,
      'Failed to refresh access token.'
    );
  }
});

// change current users password
export const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.userId);
  if (!user) {
    return sendApiResponse(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      false,
      'User not found.'
    );
  }
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return sendApiResponse(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      false,
      'Current password is incorrect.'
    );
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  sendApiResponse(res, HTTP_STATUS.OK, true, 'Password changed successfully');
});

// get current users information
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    return sendApiResponse(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      false,
      'User not found.'
    );
  }
  sendApiResponse(res, HTTP_STATUS.OK, true, 'User fetched successfully', user);
});

// Controller to update a user by ID
export const updateAccountDetails = asyncHandler(async (req, res, next) => {
  const { fullName, email } = req.body;
  const currentUserId = req.user.userId;

  if (!fullName || !email) {
    return sendApiError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      false,
      'Missing fullName or email in request body'
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    currentUserId,
    { fullName, email },
    { new: true }
  ).select('username email fullName avatar coverImage ');

  if (!updatedUser) {
    return sendApiResponse(
      res,
      HTTP_STATUS.NOT_FOUND,
      false,
      'User not found.'
    );
  }

  sendApiResponse(
    res,
    HTTP_STATUS.OK,
    true,
    'User updated successfully',
    updatedUser
  );
});

// controller for updating a user's avatar
export const changeCurrentUserAvatar = asyncHandler(async (req, res) => {
  // Check if the file exists
  const file = req.file?.path;
  if (!file) {
    return sendApiError(res, HTTP_STATUS.BAD_REQUEST, 'No file uploaded');
  }

  try {
    // Upload the file to Cloudinary
    const newAvatar = await uploadFileToCloudinary(file);
    const avatarUrl = newAvatar?.secure_url;
    if (!avatarUrl) {
      return sendApiError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Failed to upload avatar'
      );
    }
    // Retrieve current user ID
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      return sendApiError(res, HTTP_STATUS.BAD_REQUEST, 'User not found');
    }

    const UserId = req.user?.userId;
    const currentUser = await User.findById(UserId);

    // If there's an existing avatar URL, delete the old avatar
    if (currentUser?.avatar) {
      await deleteImageFromCloudinary(currentUser.avatar);
    }

    // Update user avatar
    const updatedUser = await User.findByIdAndUpdate(
      currentUserId,
      { avatar: avatarUrl },
      { new: true }
    ).select('avatar');

    if (!updatedUser) {
      return sendApiError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    // Send success response
    return sendApiResponse(
      res,
      HTTP_STATUS.OK,
      true,
      'Avatar updated successfully'
    );
  } catch (error) {
    // Catch any unexpected errors and clean up
    return sendApiError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to update avatar',
      error.message
    );
  }
});

// Controller to update a user's coverImage
export const changeCurrentUserCoverImage = asyncHandler(async (req, res) => {
  // Check if the file exists
  const file = req.file?.path;
  if (!file) {
    return sendApiError(res, HTTP_STATUS.BAD_REQUEST, 'No file uploaded');
  }

  try {
    // Upload the file to Cloudinary
    const newCoverImageUrl = await uploadFileToCloudinary(file);
    const coverImageUrl = newCoverImageUrl?.secure_url;

    if (!newCoverImageUrl) {
      return sendApiError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Failed to upload coverImage'
      );
    }

    // Retrieve current user ID
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      return sendApiError(res, HTTP_STATUS.BAD_REQUEST, 'User not found');
    }
    const UserId = req.user?.userId;
    const currentUser = await User.findById(UserId);

    // If there's an existing avatar URL, delete the old avatar
    if (currentUser?.coverImage) {
      await deleteImageFromCloudinary(currentUser.coverImage);
    }

    // Update user avatar
    const updatedUser = await User.findByIdAndUpdate(
      currentUserId,
      { coverImage: coverImageUrl },
      { new: true }
    ).select('avatar');

    if (!updatedUser) {
      return sendApiError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
    }
    // Send success response
    return sendApiResponse(
      res,
      HTTP_STATUS.OK,
      true,
      'coverImage updated successfully'
    );
  } catch (error) {
    // Catch any unexpected errors and clean up
    return sendApiError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to update coverImage',
      error.message
    );
  }
});
