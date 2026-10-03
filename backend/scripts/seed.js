// Product catalog seeder - inserts seed/products.seed.json into MongoDB.
//
//   npm run seed:products
//
// Upserts by `sku` with $setOnInsert: running it twice is a no-op, and
// runtime state (stock, soldCount, rating) survives a re-seed. Delete the
// collection first if you want the pristine numbers back.

const path = require('path');
try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch {
  // no .env -> config/db falls back to its default connection string
}

const { connectDB, disconnectDB } = require('../config/db');
const Product = require('../models/Product');
const seedData = require('../seed/products.seed.json');

async function main() {
  await connectDB();

  // Validate first: bulkWrite skips mongoose validation, and a bad seed file
  // should fail loudly here rather than silently write nothing.
  for (const doc of seedData) {
    await new Product(doc).validate();
  }

  const ops = seedData.map(doc => ({
    updateOne: {
      filter: { sku: doc.sku },
      update: { $setOnInsert: doc },
      upsert: true,
    },
  }));
  const result = await Product.bulkWrite(ops, { ordered: false });

  // $setOnInsert upserts land in upsertedCount, not insertedCount
  const created = (result.insertedCount || 0) + (result.upsertedCount || 0);
  console.log(
    `[seed-products] ${created} created, ${result.matchedCount} already present ` +
      `(${seedData.length} total in file)`
  );

  await disconnectDB();
}

main().catch(err => {
  console.error('[seed-products] failed:', err.message);
  process.exitCode = 1;
  return disconnectDB().finally(() => process.exit(1));
});
