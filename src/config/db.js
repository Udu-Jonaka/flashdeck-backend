const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Attempt to connect to the database using the URI from our .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // If the database fails to connect, crash the server immediately (status 1)
    // It's better to fail fast than to run a server without a database!
    process.exit(1);
  }
};

module.exports = connectDB;
