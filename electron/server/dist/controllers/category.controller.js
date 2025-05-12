const Category = require("../models/category.model");

/**
 * Get all categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCategories = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { active, search, parent } = req.query;

    // Build query based on filters
    let query = {};

    if (active === "true") {
      query.active = true;
    }

    if (parent) {
      query.parent = parent === "null" ? null : parent;
    }

    if (search) {
      query.$or = [
        { "name.en": { $regex: search, $options: "i" } },
        { "name.ku": { $regex: search, $options: "i" } },
      ];
    }

    // Fetch categories from database
    const categories = await Category.find(query).sort({ "name.en": 1 });

    // Return categories
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

/**
 * Get category tree (hierarchical)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCategoryTree = async (req, res) => {
  try {
    const categoryTree = await Category.getCategoryTree();
    res.json(categoryTree);
  } catch (error) {
    console.error("Error fetching category tree:", error);
    res.status(500).json({ error: "Failed to fetch category tree" });
  }
};

/**
 * Get a single category by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
};

/**
 * Create a new category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, parent, image, active } = req.body;

    // Validate required fields
    if (!name || !name.en) {
      return res
        .status(400)
        .json({ error: "Category name in English is required" });
    }

    // Create category
    const categoryData = {
      name,
      active: active !== undefined ? active : true,
    };

    // Add optional fields if provided
    if (parent) {
      categoryData.parent = parent;
    }

    if (image) {
      categoryData.image = image;
    }

    const category = new Category(categoryData);
    await category.save();

    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: messages.join(", ") });
    }

    res.status(500).json({ error: "Failed to create category" });
  }
};

/**
 * Update a category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent, image, active } = req.body;

    // Find category
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Update fields
    if (name && name.en) {
      category.name = name;
    }

    if (parent !== undefined) {
      // Prevent circular references
      if (parent && parent.toString() === id) {
        return res
          .status(400)
          .json({ error: "A category cannot be its own parent" });
      }

      // Check if new parent is a descendant of this category to prevent circular references
      if (parent) {
        const descendants = await Category.getDescendants(id);
        if (
          descendants.some((desc) => desc._id.toString() === parent.toString())
        ) {
          return res
            .status(400)
            .json({ error: "Cannot set a descendant as parent" });
        }
      }

      category.parent = parent || null;
    }

    if (image !== undefined) {
      category.image = image || "";
    }

    if (active !== undefined) {
      category.active = active;
    }

    // Save updated category
    await category.save();

    res.json(category);
  } catch (error) {
    console.error("Error updating category:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: messages.join(", ") });
    }

    res.status(500).json({ error: "Failed to update category" });
  }
};

/**
 * Delete a category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has children
    const childrenCount = await Category.countDocuments({ parent: id });
    if (childrenCount > 0) {
      return res.status(400).json({
        error:
          "Cannot delete category with subcategories. Please delete or reassign children first.",
      });
    }

    // Check if category is used by products
    // This would require importing the Product model
    // const productsUsingCategory = await Product.countDocuments({ category: id });
    // if (productsUsingCategory > 0) {
    //   return res.status(400).json({
    //     error: "Cannot delete category used by products. Please reassign products first."
    //   });
    // }

    // Delete the category
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
};
