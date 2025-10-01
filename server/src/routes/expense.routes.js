const express = require("express");
const { protect, authorize } = require("../middleware/passport");
const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  markAsPaid,
  getExpenseSummary,
} = require("../controllers/expense.controller");

const router = express.Router();

// Protected routes - require authentication
router.use(protect);

// Routes accessible to all authenticated users
router.get("/", getExpenses);
router.get("/summary", getExpenseSummary);
router.get("/:id", getExpense);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

// Routes that require specific permissions
router.put("/:id/approve", authorize("expenses", "approve"), approveExpense);
router.put("/:id/reject", authorize("expenses", "approve"), rejectExpense);
router.put("/:id/paid", authorize("expenses", "approve"), markAsPaid);

module.exports = router;
