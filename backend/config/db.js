const mongoose = require('mongoose');
const { env } = require('./env');

mongoose.set('strictQuery', true);

mongoose.connection.on('connected', () => {
  console.log(`[db] connected -> ${redact(env.mongoURL)}`);
});

mongoose.connection.on('error', err => {
  console.error('[db] error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[db] disconnected');
});

function redact(url) {
  return String(url).replace(/\/\/([^:/@]+):([^@]+)@/, '//$1:***@');
}

async function connectDB(url = env.mongoURL, options = env.mongoOptions) {
  await mongoose.connect(url, options);
  return mongoose.connection;
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

function dbState() {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
}

function isHealthy() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, disconnectDB, dbState, isHealthy, mongoose };

