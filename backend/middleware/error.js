const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { env } = require('../config/env');

/** 404 - attach when no route matched. */
function notFound(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

/** Converts any error into a consistent JSON error response. */
function errorHandler(err, req, res, _next) {
  let error = err;

  // Mongoose: invalid ObjectId
  if (error.name === 'CastError') {
    error = ApiError.badRequest(`Invalid value for "${error.path}": ${error.value}`);
  }

  // Mongoose: schema validation
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors || {}).map(e => ({
      field: e.path,
      message: e.message,
    }));
    error = ApiError.badRequest('Validation failed', details);
  }

  // Mongoose/MongoDB duplicate key (code 11000)
  if (error.code === 11000) {
    const fields = Object.keys(error.keyPattern || error.keyValue || {});
    error = ApiError.conflict(
      fields.length ? `Duplicate value for: ${fields.join(', ')}` : 'Duplicate data',
      { fields }
    );
  }

  // express.json() body parse failure
  if (error.type === 'entity.parse.failed') {
    error = ApiError.badRequest('Malformed JSON in request body');
  }

  // body-parser payload too large
  if (error.type === 'entity.too.large') {
    error = ApiError.badRequest('Request body too large');
  }

  const statusCode = error.statusCode || error.status || 500;
  const message =
    error.isOperational || statusCode < 500 ? error.message : 'Internal server error';

  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  // eslint-disable-next-line no-console -- level is chosen at runtime
  console[logLevel](`[error] ${req.method} ${req.originalUrl} -> ${statusCode}: ${message}`);
  if (statusCode >= 500 && error.stack) {
    console.error(error.stack);
  }

  // Never leak stack traces or internals in production
  const stack = env.isProd || statusCode < 500 ? undefined : error.stack;
  const details = error.details || null;

  ApiResponse.error(res, statusCode, message, details, stack);
}

module.exports = { notFound, errorHandler };
