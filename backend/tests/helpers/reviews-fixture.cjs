const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/** Dedicated DB and random port: never seed or clean the developer's ecommerce DB. */
async function startReviewFixture() {
  process.env.NODE_ENV = 'test';
  const database = `bazaar_reviews_test_${randomUUID().replaceAll('-', '')}`;
  const mongoURI = process.env.REVIEWS_TEST_MONGO_URI || `mongodb://127.0.0.1:27017/${database}`;
  process.env.mongoURL = mongoURI;
  const app = require('../../app');
  const { signAccessToken } = require('../../utils/token');
  const { User, Product, Review } = mongoose.models;
  let server;
  let stopped = false;

  async function stop() {
    if (stopped) return;
    stopped = true;
    if (server) await new Promise(resolve => server.close(resolve));
    try {
      if (mongoose.connection.db?.databaseName === database) {
        await mongoose.connection.db.dropDatabase();
      }
    } finally {
      await mongoose.disconnect();
    }
  }

  try {
    await mongoose.connect(mongoURI, {
      dbName: database,
      serverSelectionTimeoutMS: 5000,
    });
    if (mongoose.connection.db.databaseName !== database) throw new Error('Review test database isolation failed');
    await Promise.all(Object.values(mongoose.models).map(model => model.init()));
    const password = await bcrypt.hash('ReviewTest123!', 10);
    let nextUser = 0;
    async function createUser(overrides = {}) {
      const number = ++nextUser;
      const user = await User.create({
        username: `review_user_${number}`,
        email: `review_user_${number}@example.com`,
        phone: `90000${String(number).padStart(5, '0')}`,
        name: `Review tester ${number}`,
        password,
        ...overrides,
      });
      return {
        user,
        token: signAccessToken(user),
        session: { id: String(user._id), username: user.username, name: user.name, role: user.role },
      };
    }
    const users = await Promise.all([createUser(), createUser(), createUser()]);
    let nextProduct = 0;
    async function createProduct(overrides = {}) {
      const number = ++nextProduct;
      return Product.create({
        sku: `REVIEW-TEST-${number}`, slug: `review-test-product-${number}`,
        name: `Review test product ${number}`, brand: 'Test brand',
        description: 'A product used only in the isolated review test database.',
        price: 40, category: 'shirts', stock: 20,
        images: [{ url: '/products/shirts-101.jpg', alt: 'Test product', isPrimary: true }],
        ...overrides,
      });
    }
    const product = await createProduct();
    server = await new Promise((resolve, reject) => {
      const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
      listening.once('error', reject);
    });
    return { baseUrl: `http://127.0.0.1:${server.address().port}`, users, product,
      createUser, createProduct, User, Product, Review, stop };
  } catch (error) {
    await stop();
    throw error;
  }
}

module.exports = { startReviewFixture };
