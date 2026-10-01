const express = require('express');
const { isHealthy } = require('../config/db');

const version = require('../package.json').version;

const router = express.Router();

// Mounted before the rate limiter so monitors never get 429.
router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    status: 'ok',
    db: isHealthy() ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    version,
  });
});

module.exports = router;
