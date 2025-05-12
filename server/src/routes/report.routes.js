const express = require("express");
const { protect, authorize } = require("../middleware/passport");
const reportController = require("../controllers/report.controller");

const router = express.Router();

// Protected routes - all report endpoints require authentication
router.use(protect);

// Sales report routes
router.get("/sales", reportController.getSalesReport);
router.get("/sales/export/csv", reportController.exportSalesReportCSV);
router.get("/sales/export/pdf", reportController.exportSalesReportPDF);

// Inventory report routes
router.get("/inventory", reportController.getInventoryReport);
router.get("/inventory/export/csv", reportController.exportInventoryReportCSV);
router.get("/inventory/export/pdf", reportController.exportInventoryReportPDF);

// Staff report routes
router.get("/staff", reportController.getStaffReport);
router.get("/staff/export/csv", reportController.exportStaffReportCSV);
router.get("/staff/export/pdf", reportController.exportStaffReportPDF);

// Customer report routes
router.get("/customers", reportController.getCustomerReport);
router.get("/customers/export/csv", reportController.exportCustomerReportCSV);
router.get("/customers/export/pdf", reportController.exportCustomerReportPDF);

module.exports = router;
