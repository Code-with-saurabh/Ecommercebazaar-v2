/**
 * Model registry — require('./models') once at boot (see app.js).
 *
 * Why this file exists:
 *   1. every schema is compiled exactly once, in a fixed order;
 *   2. `populate('user')`, `ref: 'Product'` lookups and the cascade hooks
 *      (User -> Address/Cart/Review, Review -> Product rating) can resolve
 *      model names because the models are actually registered;
 *   3. the rest of the app has one import instead of six.
 *
 *   const { Product, Order } = require('../models');
 */

const User = require('./User');
const Address = require('./Address');
const Product = require('./Product');
const Cart = require('./Cart');
const Coupon = require('./Coupon');
const Review = require('./Review');
const Order = require('./Order');

module.exports = {
  User,
  Address,
  Product,
  Cart,
  Coupon,
  Review,
  Order,
};
