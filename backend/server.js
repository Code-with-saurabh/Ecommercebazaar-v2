const { env } = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');

async function main() {
  const app = require('./app');

  try {
    await connectDB();
  } catch (err) {
    console.error(`[db] connection failed: ${err.message}`);
    console.error('[db] server will start anyway; /api/health will report db: disconnected');
  }

  const server = app.listen(env.port, () => {
    console.log(`Bazaar API listening on http://localhost:${env.port} [${env.nodeEnv}]`);
  });

  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n${signal} received, shutting down...`);

    const timer = setTimeout(() => {
      console.error('[shutdown] timed out, forcing exit');
      process.exit(1);
    }, 10000);
    if (typeof timer.unref === 'function') timer.unref();

    server.close(async () => {
      try {
        await disconnectDB();
      } catch (err) {
        console.error('[shutdown] db disconnect error:', err.message);
      }
      console.log('[shutdown] done');
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', reason => {
    console.error('[unhandledRejection]', reason);
  });
}

main().catch(err => {
  console.error('[fatal]', err);
  process.exit(1);
});
