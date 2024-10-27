import Joi from 'joi';

// Define the schema for user validation
const userSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.base': 'Username must be a string.',
            'string.empty': 'Username is required.',
            'string.min': 'Username must be at least 3 characters long.',
            'string.max': 'Username must be less than 30 characters long.',
        }),
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.base': 'Email must be a string.',
            'string.empty': 'Email is required.',
            'string.email': 'Email must be a valid email address.',
        }),
    password: Joi.string()
        .min(6)
        .max(50)  // Limit to a reasonable max length
        .required()
        .messages({
            'string.base': 'Password must be a string.',
            'string.empty': 'Password is required.',
            'string.min': 'Password must be at least 6 characters long.',
            'string.max': 'Password must be less than 50 characters long.',
        }),
    fullName: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.base': 'Full Name must be a string.',
            'string.empty': 'Full Name is required.',
            'string.min': 'Full Name must be at least 3 characters long.',
            'string.max': 'Full Name must be less than 100 characters long.',
        }),
    avatar: Joi.string()
        .uri()
        .optional()
        .messages({
            'string.base': 'Avatar must be a valid URL.',
            'string.uri': 'Avatar must be a valid URL format.',
        }),
    coverImage: Joi.string()
        .uri()
        .optional()
        .messages({
            'string.base': 'Cover Image must be a valid URL.',
            'string.uri': 'Cover Image must be a valid URL format.',
        }),
    watchHistory: Joi.array()
        .items(Joi.string().hex().length(24)) // Assuming ObjectId references
        .optional()
        .messages({
            'array.base': 'Watch History must be an array of valid Object IDs.',
            'string.hex': 'Each watch history item must be a valid Object ID.',
        }),
});

// Export the validation function
export const validateUser = (data) => {
    return userSchema.validate(data, { abortEarly: false });
};
