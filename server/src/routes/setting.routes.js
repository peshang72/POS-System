const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const settingController = require("../controllers/setting.controller");

const router = express.Router();

// Protected routes
router.use(protect);

// General settings routes
router.get("/general", settingController.getGeneralSettings);
router.put("/general", settingController.updateGeneralSettings);

// Get user's exchange rate (for POS usage)
router.get("/exchange-rate", settingController.getUserExchangeRate);

// Public routes for all authenticated users
router.get("/", (req, res) => {
  res.json({ message: "Settings API endpoint" });
});

module.exports = router;
