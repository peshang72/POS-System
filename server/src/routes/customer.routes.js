const express = require("express");
const { protect, authorize } = require("../middleware/passport");
const customerController = require("../controllers/customer.controller");

const router = express.Router();

// Protected routes
router.use(protect);

// Routes accessible to all authenticated users
router.get("/", customerController.getCustomers);
router.get("/:id", customerController.getCustomer);
router.post("/", customerController.createCustomer);
router.put("/:id", customerController.updateCustomer);
router.delete("/:id", customerController.deleteCustomer);

// Routes accessible only to admin and manager roles
router.use(authorize("admin", "manager"));
router.get("/:id/transactions", customerController.getCustomerTransactions);

module.exports = router;
