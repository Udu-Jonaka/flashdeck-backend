const express = require("express");
const router = express.Router();
// 1. Import the new controller function
const {
  registerUser,
  verifyPin,
  resendPin,
  loginUser,
  getProfile,
} = require("../controllers/auth.controller");
// 2. Import the middleware
const { protect } = require("../middlewares/auth.middleware");

router.post("/register", registerUser);
router.post("/verify-email", verifyPin);
router.post("/resend-pin", resendPin);
router.post("/login", loginUser);

// 3. Add the protected route
router.get("/profile", protect, getProfile);

module.exports = router;
