const generateToken = require("../utils/generateToken");
const User = require("../models/User");
const Deck = require("../models/Deck");
const bcrypt = require("bcryptjs");
const generatePin = require("../utils/generatePin");
const { sendVerificationEmail } = require("../services/email.service");

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
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

    // 5. Send the email (we don't await this so it doesn't block the response)
    sendVerificationEmail(email, pin).catch(console.error);

    // 6. Send success response back to Expo
    res.status(201).json({
      message:
        "Registration successful. Please check your email for the verification PIN.",
      email: user.email, // Send email back so Expo knows who to verify on the next screen
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// VERIFY PIN FUNCTION
const verifyPin = async (req, res) => {
  try {
    const { email, pin } = req.body;

    // 1. Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "Account is already verified" });
    }

    // 3. Check if the PIN matches
    const incomingPin = String(pin).trim();
    const databasePin = String(user.verificationPin).trim();

    if (incomingPin !== databasePin) {
      return res.status(400).json({ message: "Invalid PIN" });
    }

    // 4. Success! Update user status
    user.isVerified = true;
    user.verificationPin = undefined; // Clear the PIN from the database so it can't be reused
    await user.save();

    // 5. Generate their token
    const token = generateToken(user._id);

    res.status(200).json({
      message: "Account verified successfully",
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ message: "Server error during verification" });
  }
};

// LOGIN FUNCTION
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 2. Enforce Verification
    // We don't let them log in if they haven't verified their email yet!
    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email to log in" });
    }

    // 3. Check the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 4. Success! Give them a token
    const token = generateToken(user._id);

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// RESEND PIN FUNCTION
const resendPin = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "Account is already verified" });
    }

    // 3. Generate a new PIN and save it
    const pin = generatePin();
    user.verificationPin = pin;
    await user.save();

    // 4. Send the new verification email
    await sendVerificationEmail(email, pin);

    res.status(200).json({ message: "A new PIN has been sent to your email" });
  } catch (error) {
    console.error("Resend PIN Error:", error);
    res.status(500).json({ message: "Server error while resending PIN" });
  }
};

// GET USER PROFILE FUNCTION (Protected)
const getProfile = async (req, res) => {
  try {
    const user = req.user; // From auth.middleware
    
    // Get the start of today and yesterday for streak calculation
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    
    // Check the last active date (set to start of day for comparison)
    let lastActiveStart = null;
    if (user.lastActiveDate) {
      lastActiveStart = new Date(user.lastActiveDate.getFullYear(), user.lastActiveDate.getMonth(), user.lastActiveDate.getDate());
    }

    if (!lastActiveStart || lastActiveStart < startOfYesterday) {
      // Missing or older than yesterday -> Reset streak to 1
      user.streakCount = 1;
    } else if (lastActiveStart.getTime() === startOfYesterday.getTime()) {
      // Exactly yesterday -> Increment streak
      user.streakCount = (user.streakCount || 0) + 1;
    }
    // If it's today, we don't change the streak.

    // Always update lastActiveDate to now
    user.lastActiveDate = now;
    await user.save();

    // Fetch deck and card count
    const userDecks = await Deck.find({ user: user._id });
    const deckCount = userDecks.length;
    const cardCount = userDecks.reduce((sum, deck) => sum + (deck.cards ? deck.cards.length : 0), 0);

    res.status(200).json({
      message: "Profile fetched successfully",
      user,
      deckCount,
      cardCount,
    });
  } catch (error) {
    console.error("Fetch Profile Error:", error);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
};

// UPDATE USER PROFILE (Protected)
const updateProfile = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ message: "Username cannot be empty" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profile.username = username.trim();
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
};

// Don't forget to export it!
module.exports = { registerUser, verifyPin, resendPin, loginUser, getProfile, updateProfile };
