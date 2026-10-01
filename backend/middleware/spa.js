const express = require('express');
const path = require('path');
const fs = require('fs');
const { env } = require('../config/env');

const DIST_DIR = path.resolve(__dirname, '..', '..', 'frontend', 'dist');

/**
 * Serves the built Vite SPA (frontend/dist) when it exists:
 * fingerprinted assets get immutable caching, index.html gets no-cache,
 * and any other GET that accepts HTML falls back to the app shell.
 */
function mountSpa(app) {
  if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) return;

  app.use(
    express.static(DIST_DIR, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }
      },
    })
  );

  app.get('*', (req, res, next) => {
    if (req.path.startsWith(env.apiPrefix) || !req.accepts('html')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

module.exports = { mountSpa };
