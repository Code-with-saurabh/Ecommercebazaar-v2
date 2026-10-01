const mongoose = require('mongoose');
const { USERNAME_RE, EMAIL_RE } = require('../utils/validation');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'username is required'],
      trim: true,
      minlength: [3, 'username must be at least 3 characters'],
      maxlength: [25, 'username must be at most 25 characters'],
      match: [USERNAME_RE, 'username may only contain letters, numbers, _ . -'],
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      trim: true,
      lowercase: true, // "A@B.com" and "a@b.com" are the same account
      maxlength: [254, 'email must be at most 254 characters'],
      match: [EMAIL_RE, 'email must be a valid address'],
      unique: true,
    },
    phone: {
      type: String,
      required: [true, 'phone is required'],
      trim: true,
      maxlength: [20, 'phone must be at most 20 characters'],
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // never returned unless a handler explicitly asks for it
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
