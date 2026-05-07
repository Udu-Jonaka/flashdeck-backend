const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    }, // This will be your bcrypt hashed string
    verificationPin: {
      type: String,
    }, // The random 5-digit code
    isVerified: {
      type: Boolean,
      default: false,
    },
    streakCount: {
      type: Number,
      default: 1, // Start with 1 when they sign up/login for the first time
    },
    lastActiveDate: {
      type: Date,
      default: null,
    },
    profile: {
      username: { type: String },
      // You can expand this later with stats, avatar, etc.
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
