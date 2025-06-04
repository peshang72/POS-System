/**
 * Utility function to handle async errors in Express route handlers
 * Eliminates the need for try/catch blocks in controllers
 * @param {Function} fn - The async route handler function
 * @returns {Function} - Express middleware function with error handling
 */
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error("Error in async handler:", err);
    res.status(500).json({
      success: false,
      error: "Server Error",
      message: err.message || "An unexpected error occurred",
    });
  });
};
