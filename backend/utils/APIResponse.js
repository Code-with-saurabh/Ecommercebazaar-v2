/**
 * Uniform response envelope for every API endpoint.
 *
 * success:  { success: true,  message, data?, meta? }
 * failure:  { success: false, message, details?, stack? }
 */
class APIResponse {
  static success(res, statusCode, message, data = null, meta = undefined) {
    const body = { success: true, message };
    if (data !== null && data !== undefined) body.data = data;
    if (meta !== undefined) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static ok(res, message = 'OK', data = null, meta = undefined) {
    return APIResponse.success(res, 200, message, data, meta);
  }

  static created(res, message = 'Created', data = null, meta = undefined) {
    return APIResponse.success(res, 201, message, data, meta);
  }

  static noContent(res) {
    return res.status(204).end();
  }

  static paginated(res, { items, total, page, limit, message = 'OK' }) {
    return APIResponse.success(res, 200, message, items, {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext: page * limit < total,
    });
  }

  static error(res, statusCode, message, details = null, stack = undefined) {
    const body = { success: false, message };
    if (details) body.details = details;
    if (stack) body.stack = stack;
    return res.status(statusCode).json(body);
  }
}

module.exports = APIResponse;

