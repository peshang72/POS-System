const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const { protect } = require("../middleware/passport");

// Get dashboard statistics and data
router.get("/", protect, dashboardController.getDashboardData);

module.exports = router;
