import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import uniqueValidator from 'mongoose-unique-validator';
import jwt from 'jsonwebtoken';

const { Schema } = mongoose;

// Set bcrypt salt rounds for password hashing
const SALT_ROUNDS = 12;

// Create User Schema
const userSchema = new Schema({
  watchHistory: [{
    type: Schema.Types.ObjectId,
    ref: 'Video' // Assume 'Video' is another model
  }],
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, 'Please enter a valid email address']
  },
  fullName: {
    type: String,
    required: true
  },
  avatar: {
    type: String, // URL of the avatar image
  },
  coverImage: {
    type: String, // URL of the cover image
  },
  password: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String, // Store only hashed tokens in production
  },
  resetToken: {
    type: String, // For password reset functionality
    default: null
  },
  resetTokenExpiry: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lastLoginIP: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  role:{
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, { timestamps: true }); // Automatically adds `createdAt` and `updatedAt`

// Unique validation plugin for fields like `email` and `username`
userSchema.plugin(uniqueValidator, { message: '{PATH} already exists!' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare provided password with hashed password in DB
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT Access Token
userSchema.methods.generateAccessToken = function() {
  const token = jwt.sign(
    { userId: this._id, email: this.email, username: this.username, fullName: this.fullName, role: this.role},
    process.env.JWT_SECRET, // Use a secure, environment-protected secret
    { expiresIn: '15m' } // Short expiration for access tokens
  );
  return token;
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function() {
  const refreshToken = jwt.sign(
    { userId: this._id, email: this.email},
    process.env.JWT_REFRESH_SECRET, // Use a separate secret for refresh tokens
    { expiresIn: '7d' } // Long expiration for refresh tokens
  );
  return refreshToken;
};

// Automatically update `updatedAt` on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
