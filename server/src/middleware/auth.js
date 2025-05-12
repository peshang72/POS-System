/**
 * Authentication middleware
 * Centralizes authentication and authorization functions
 */
const { protect, authorize } = require("./passport");

module.exports = {
  protect,
  authorize,
};
