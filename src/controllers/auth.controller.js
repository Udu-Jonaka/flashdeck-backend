const generateToken = require("../utils/generateToken");
const User = require("../models/User");
const Deck = require("../models/Deck");
const bcrypt = require("bcryptjs");
const generatePin = require("../utils/generatePin");
const { sendVerificationEmail } = require("../services/email.service");
const asyncHandler = require("../utils/asyncHandler");

// REGISTER USER
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Check if user already exists
  let user = await User.findOne({ email });
  if (user) {
    res.status(400);
    throw new Error("User already exists");
  }

  // 2. Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Generate the 5-digit PIN
  const pin = generatePin();

  // 4. Create the new user in the database
  user = new User({
    email,
    password: hashedPassword,
    verificationPin: pin,
    isVerified: false,
    profile: {
      username: name || "Student",
    },
  });

  await user.save();

  // 5. Send the email (non-blocking)
  sendVerificationEmail(email, pin).catch((err) =>
    console.error("Email Service Error:", err.message)
  );

  // 6. Send success response back to Expo
  res.status(201).json({
    message: "Registration successful. Please check your email for the verification PIN.",
    email: user.email,
  });
});

// VERIFY PIN FUNCTION
const verifyPin = asyncHandler(async (req, res) => {
  const { email, pin } = req.body;

  // 1. Find the user
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // 2. Check if already verified
  if (user.isVerified) {
    res.status(400);
    throw new Error("Account is already verified");
  }

  // 3. Check if the PIN matches
  const incomingPin = String(pin).trim();
  const databasePin = String(user.verificationPin).trim();

  if (incomingPin !== databasePin) {
    res.status(400);
    throw new Error("Invalid PIN");
  }

  // 4. Success! Update user status
  user.isVerified = true;
  user.verificationPin = undefined;
  await user.save();

  // 5. Generate their token
  const token = generateToken(user._id);

  res.status(200).json({
    message: "Account verified successfully",
    token,
    user: { id: user._id, email: user.email },
  });
});

// LOGIN FUNCTION
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Find the user
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401); // Unauthorized
    throw new Error("Invalid email or password");
  }

  // 2. Enforce Verification
  if (!user.isVerified) {
    res.status(403); // Forbidden
    throw new Error("Please verify your email to log in");
  }

  // 3. Check the password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // 4. Success! Give them a token
  const token = generateToken(user._id);

  res.status(200).json({
    message: "Login successful",
    token,
    user: { id: user._id, email: user.email },
  });
});

// RESEND PIN FUNCTION
const resendPin = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // 1. Find the user
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // 2. Check if already verified
  if (user.isVerified) {
    res.status(400);
    throw new Error("Account is already verified");
  }

  // 3. Generate a new PIN and save it
  const pin = generatePin();
  user.verificationPin = pin;
  await user.save();

  // 4. Send the new verification email
  await sendVerificationEmail(email, pin);

  res.status(200).json({ message: "A new PIN has been sent to your email" });
});

// GET USER PROFILE FUNCTION (Protected)
const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  // Get the start of today and yesterday for streak calculation
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  // Check the last active date
  let lastActiveStart = null;
  if (user.lastActiveDate) {
    lastActiveStart = new Date(
      user.lastActiveDate.getFullYear(),
      user.lastActiveDate.getMonth(),
      user.lastActiveDate.getDate()
    );
  }

  if (!lastActiveStart || lastActiveStart < startOfYesterday) {
    user.streakCount = 1;
  } else if (lastActiveStart.getTime() === startOfYesterday.getTime()) {
    user.streakCount = (user.streakCount || 0) + 1;
  }

  user.lastActiveDate = now;
  await user.save();

  // Fetch deck and card count
  const userDecks = await Deck.find({ user: user._id });
  const deckCount = userDecks.length;
  const cardCount = userDecks.reduce(
    (sum, deck) => sum + (deck.cards ? deck.cards.length : 0),
    0
  );

  res.status(200).json({
    message: "Profile fetched successfully",
    user,
    deckCount,
    cardCount,
  });
});

// UPDATE USER PROFILE (Protected)
const updateProfile = asyncHandler(async (req, res) => {
  const { username } = req.body;

  if (!username || !username.trim()) {
    res.status(400);
    throw new Error("Username cannot be empty");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.profile.username = username.trim();
  await user.save();

  res.status(200).json({
    message: "Profile updated successfully",
    user,
  });
});

module.exports = {
  registerUser,
  verifyPin,
  resendPin,
  loginUser,
  getProfile,
  updateProfile,
};
