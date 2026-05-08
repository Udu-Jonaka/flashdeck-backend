// 1. Import core packages
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

// 2. Import internal modules
const connectDB = require("./src/config/db");
const validateEnv = require("./src/utils/validateEnv");
const { errorHandler, notFound } = require("./src/middlewares/error.middleware");
const authRoutes = require("./src/routes/auth.routes");
const deckRoutes = require("./src/routes/deck.routes");

// 3. Validation & Database
validateEnv(); // Ensure all required environment variables are present
connectDB(); // Connect to MongoDB

// 4. Initialize Express
const app = express();

// 5. Apply Global Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS

// Logging: Use 'combined' format in production for more detail, 'dev' for local development
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Rate Limiting: Prevent brute-force and DoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use("/api", limiter); // Apply limiter to all API routes

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6. Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/decks", deckRoutes);

// Basic Health Check Route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Backend is sizzling! 🍳",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// 7. Error Handling Middleware
// (Must be defined AFTER all routes)
app.use(notFound);
app.use(errorHandler);

// 8. Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
