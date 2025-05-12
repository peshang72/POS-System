const express = require("express");
const { protect, authorize } = require("../middleware/passport");
const productController = require("../controllers/product.controller");

const router = express.Router();

// Protected routes - require authentication
router.use(protect);

// Routes accessible by all authenticated users
router.get("/", productController.getAllProducts);
router.get("/search/:query", productController.searchProducts);

// Routes requiring manager or admin access
router.use(authorize("admin", "manager"));
router.get("/generate-barcode", productController.generateBarcode);
router.get("/export-barcodes", productController.exportProductsToCSV);
router.patch("/:id/quantity", productController.incrementQuantity);
router.post("/", productController.createProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);
router.get("/:id", productController.getProductById);

module.exports = router;
