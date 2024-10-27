// constants.js

// API URL constants
export const API_URL = 'http://localhost:3000/api';

// Status codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
};

// Error messages
export const ERROR_MESSAGES = {
    PRODUCT_NOT_FOUND: 'Product not found',
    PRODUCT_CREATION_FAILED: 'Error creating product',
    PRODUCT_FETCH_FAILED: 'Error fetching products',
};

// Other constants
export const DB_CONNECTION_TIMEOUT = 5000; // 5 seconds
