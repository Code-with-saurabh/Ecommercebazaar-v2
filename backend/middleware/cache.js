/** Cache-Control for JSON API responses: never let proxies or browsers store them. */
function apiCache(_req, res, next) {
  res.setHeader('Cache-Control', 'no-store');
  next();
}

module.exports = { apiCache };
