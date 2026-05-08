/**
 * Validates that all required environment variables are present.
 * If any are missing, it logs an error and exits the process.
 */
const validateEnv = () => {
  const required = [
    "PORT",
    "MONGO_URI",
    "JWT_SECRET",
    "GROQ_API_KEY",
    "EMAIL_USER",
    "EMAIL_PASS",
    "SMTP_URL",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `[FATAL] Missing required environment variables: ${missing.join(", ")}`
    );
    console.error("Please check your .env file or deployment settings.");
    process.exit(1);
  }

  console.log("Environment variables validated successfully.");
};

module.exports = validateEnv;
