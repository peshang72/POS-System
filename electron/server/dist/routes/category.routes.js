const express = require("express");
const { protect, authorize } = require("../middleware/passport");
const categoryController = require("../controllers/category.controller");

const router = express.Router();

// Protected routes - require authentication
router.use(protect);

// Routes accessible to all authenticated users
router.get("/", categoryController.getCategories);
router.get("/tree", categoryController.getCategoryTree);
router.get("/:id", categoryController.getCategory);

// Routes requiring manager or admin access
router.use(authorize("admin", "manager"));
router.post("/", categoryController.createCategory);
router.put("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;
