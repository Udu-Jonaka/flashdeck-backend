// 1. Import core packages
require("dotenv").config(); // Loads the variables from your .env file immediately
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoutes = require("./src/routes/auth.routes");
const deckRoutes = require("./src/routes/deck.routes");

// 2. Import database connection
const connectDB = require("./src/config/db");

// 3. Initialize Express
const app = express();

// 4. Connect to the database
connectDB();

// 5. Apply Global Middleware
app.use(helmet()); // Secures your Express apps by setting various HTTP headers
app.use(cors()); // Allows your Expo app to make requests to this backend
app.use(morgan("dev")); // Logs incoming requests to the terminal (great for debugging)

// Parses incoming JSON payloads (replaces body-parser)
app.use(express.json());
// Parses URL-encoded data (useful if you ever send form data)
app.use(express.urlencoded({ extended: true }));

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/decks", deckRoutes);

// 6. Basic Health Check Route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Backend is sizzling! 🍳",
  });
});

// 7. Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
