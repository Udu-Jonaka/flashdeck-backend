const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  // Signs a new token with the user's database ID and your secret key
  // The token will expire in 30 days, keeping the user logged in on the mobile app
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = generateToken;
