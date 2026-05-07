const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // 1. Check if the token exists in the headers
  // The standard format is: "Authorization: Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 2. Extract the token from the string (split removes the word "Bearer ")
      token = req.headers.authorization.split(" ")[1];

      // 3. Verify the token using your secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Find the user in the database using the ID from the decoded token
      // .select('-password') ensures we don't accidentally pass the hashed password forward
      req.user = await User.findById(decoded.id).select("-password");

      // 5. Move on to the actual route controller
      next();
    } catch (error) {
      console.error("Token verification failed:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  // 6. If there was no token at all
  if (!token) {
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided" });
  }
};

module.exports = { protect };
