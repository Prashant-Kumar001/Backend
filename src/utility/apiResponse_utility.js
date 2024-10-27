// utility/apiResponse_utility.js
export const sendApiResponse = (res, statusCode, success, message, data = null, errors = null) => {
  return res.status(statusCode).json({
      success,
      message,
      data,
      errors,
      statusCode,
      timestamp: new Date().toISOString(),
  });
};
