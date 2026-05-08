/**
 * Async Handler Wrapper
 * This utility wraps asynchronous route handlers to catch any errors and pass them to the next middleware (the global error handler).
 * This eliminates the need for repeated try-catch blocks in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
