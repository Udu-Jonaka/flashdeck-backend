/**
 * Global Error Handling Middleware
 * This middleware catches any errors that occur during the request-response cycle.
 * It ensures that the client always receives a clean JSON response instead of a HTML stack trace.
 */
const errorHandler = (err, req, res, next) => {
  // 1. Determine the status code
  // If the error has a status code (e.g. from a validation library), use it.
  // Otherwise, default to 500 (Internal Server Error).
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // 2. Log the error for the developer
  // In production, you might want to use a more robust logger like Winston or Datadog
  console.error(`[ERROR] ${req.method} ${req.url} - ${err.message}`);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  // 3. Send the final response to the user
  res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal Server Error",
    // Only include the stack trace in development mode for security
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

/**
 * Not Found Middleware
 * This middleware handles requests to routes that don't exist.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
