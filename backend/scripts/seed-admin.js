// Create or promote the admin account used by the admin panel.
//
//   npm run seed:admin
//
// Configuration (env): ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PHONE, ADMIN_PASSWORD.
// Without ADMIN_PASSWORD a dev-only default is used - never run that in prod.

const path = require('path');
try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch {
  // no .env -> process env / defaults below
}

const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

const DEV_DEFAULTS = {
  username: 'admin',
  email: 'admin@bazaar.local',
  phone: '9000000000',
  password: 'Admin@12345',
};

async function main() {
  const username = process.env.ADMIN_USERNAME || DEV_DEFAULTS.username;
  const email = process.env.ADMIN_EMAIL || DEV_DEFAULTS.email;
  const phone = process.env.ADMIN_PHONE || DEV_DEFAULTS.phone;
  const password = process.env.ADMIN_PASSWORD || DEV_DEFAULTS.password;
  const usingDevPassword = !process.env.ADMIN_PASSWORD;

  await connectDB();

  const existing = await User.findOne({ $or: [{ username }, { email }] });

  if (existing) {
    let changed = false;
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      changed = true;
    }
    if (existing.isActive === false) {
      existing.isActive = true;
      changed = true;
    }
    if (process.env.ADMIN_PASSWORD) {
      existing.password = await bcrypt.hash(password, 10);
      changed = true;
    }
    if (changed) await existing.save();
    console.log(
      `[seed-admin] ${changed ? 'updated' : 'already ok'}: "${existing.username}" is an active admin`
    );
  } else {
    // password goes in plain - the User pre-save hook hashes it
    const user = await User.create({
      username,
      email,
      phone,
      password,
      role: 'admin',
      isActive: true,
    });
    console.log(`[seed-admin] created admin "${user.username}" <${user.email}>`);
  }

  if (usingDevPassword) {
    console.log('[seed-admin] WARNING: using the dev default password - set ADMIN_PASSWORD before deploying');
  }

  await disconnectDB();
}

main().catch(err => {
  console.error('[seed-admin] failed:', err.message);
  process.exitCode = 1;
  return disconnectDB().finally(() => process.exit(1));
});
