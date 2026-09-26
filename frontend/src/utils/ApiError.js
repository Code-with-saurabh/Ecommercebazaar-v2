export default class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  /** status 0 -> server unreachable / timeout / offline */
  get isNetworkError() {
    return this.status === 0;
  }

  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isValidationError() {
    return this.status === 400 || this.status === 422;
  }

  get isServerError() {
    return this.status >= 500;
  }

  /** Field errors from the API envelope, when present. */
  get fieldErrors() {
    if (!Array.isArray(this.details)) return null;
    return this.details.reduce((acc, item) => {
      if (item && item.field) acc[item.field] = item.message;
      return acc;
    }, {});
  }
}
