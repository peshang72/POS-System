const express = require("express");
const { protect, authorize } = require("../middleware/passport");
const transactionController = require("../controllers/transaction.controller");

const router = express.Router();

// Protected routes
router.use(protect);

// Get all transactions
router.get("/", async (req, res) => {
  try {
    return await transactionController.getTransactions(req, res);
  } catch (error) {
    console.error("Error in transactions route:", error);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
});

// Get single transaction
router.get("/:id", async (req, res) => {
  try {
    return await transactionController.getTransaction(req, res);
  } catch (error) {
    console.error("Error getting transaction:", error);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
});

// Create new transaction
router.post("/", async (req, res) => {
  try {
    return await transactionController.createTransaction(req, res);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
});

// Process refund
router.post("/:id/refund", authorize("admin", "manager"), async (req, res) => {
  try {
    return await transactionController.processRefund(req, res);
  } catch (error) {
    console.error("Error processing refund:", error);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
});

// Redeem loyalty points
router.post("/redeem-loyalty", async (req, res) => {
  try {
    return await transactionController.redeemLoyaltyPoints(req, res);
  } catch (error) {
    console.error("Error redeeming points:", error);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
});

module.exports = router;
