const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true
    },
    email: {
      type: String,
      match: /^\S+@\S+\.\S+$/,
      unique: true,
      trim: true,
      lowercase: true,
      required: true
    },
    spotify: {
      accessToken: { type: String, required: true },
      refreshToken: { type: String, required: true },
      expiresIn: { type: String, required: true }
    },
    apiKey: String,
    isBanned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', UserSchema);
