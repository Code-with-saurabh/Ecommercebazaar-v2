/**
 * Operational (expected) API error.
 * Thrown anywhere in a route -> handled by middleware/error.js.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details = null) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized', details = null) {
    return new ApiError(401, message, details);
  }

  static forbidden(message = 'Forbidden', details = null) {
    return new ApiError(403, message, details);
  }

  static notFound(message = 'Resource not found', details = null) {
    return new ApiError(404, message, details);
  }

  static conflict(message = 'Resource already exists', details = null) {
    return new ApiError(409, message, details);
  }

  static tooMany(message = 'Too many requests, please try again later', details = null) {
    return new ApiError(429, message, details);
  }

  static internal(message = 'Internal server error', details = null) {
    return new ApiError(500, message, details);
  }
}

module.exports = ApiError;
