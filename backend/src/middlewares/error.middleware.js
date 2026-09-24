// const errorMiddleware = (err, req, res, next) => {
//   console.error(`[ERROR] ${err.message}`, err.stack);

//   let statusCode = err.statusCode || 500;
//   let message = err.message || 'Internal Server Error';

//   // Mongoose duplicate key
//   if (err.code === 11000) {
//     const field = Object.keys(err.keyValue)[0];
//     message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
//     statusCode = 400;
//   }

//   // Mongoose validation error
//   if (err.name === 'ValidationError') {
//     message = Object.values(err.errors).map(e => e.message).join(', ');
//     statusCode = 400;
//   }

//   // JWT errors
//   if (err.name === 'JsonWebTokenError') {
//     message = 'Invalid token';
//     statusCode = 401;
//   }
//   if (err.name === 'TokenExpiredError') {
//     message = 'Token expired, please log in again';
//     statusCode = 401;
//   }

//   res.status(statusCode).json({
//     success: false,
//     message,
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
//   });
// };

// module.exports = errorMiddleware;





const { ApiError } = require('../utils/ApiError');

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // Log error details for internal debugging/monitoring
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${err.message}`, err.stack);
  }

  // 1. Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    const formattedField = field.charAt(0).toUpperCase() + field.slice(1);
    error = new ApiError(400, `${formattedField} already exists`);
  }

  // 2. Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(400, messages.join(', '), messages);
  }

  // 3. Handle Invalid MongoDB ObjectId (CastError)
  if (err.name === 'CastError') {
    error = new ApiError(400, `Invalid value provided for ${err.path}`);
  }

  // 4. Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token provided');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired, please log in again');
  }

  // 5. Handle Express Malformed JSON Body Syntax Error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new ApiError(400, 'Invalid JSON payload received in request body');
  }

  // 6. Default Fallback for generic Unhandled Errors
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  // Construct standard API Error Response
  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  return res.status(error.statusCode).json(response);
};

module.exports = errorMiddleware;
