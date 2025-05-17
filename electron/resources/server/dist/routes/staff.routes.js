const express = require("express");
const { protect, authorize } = require("../middleware/passport");

const router = express.Router();

// Protected routes
router.use(protect);

// Public routes for all authenticated users
router.get("/", (req, res) => {
  res.json({ message: "Staff API endpoint" });
});

module.exports = router;
