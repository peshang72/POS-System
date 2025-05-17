const express = require("express");
const router = express.Router();
const loyaltyController = require("../controllers/loyalty.controller");
const { protect, authorize } = require("../middleware/auth");

// Get loyalty settings
router.get("/settings", protect, loyaltyController.getLoyaltySettings);

// Update loyalty settings
router.put(
  "/settings",
  protect,
  authorize("admin", "manager"),
  loyaltyController.updateLoyaltySettings
);

// Get customer transactions
router.get(
  "/transactions/:customerId",
  protect,
  loyaltyController.getCustomerTransactions
);

// Manually adjust points
router.post(
  "/adjust/:customerId",
  protect,
  authorize("admin", "manager"),
  loyaltyController.adjustPoints
);

module.exports = router;
