const Product = require("../models/product.model");
const { generateEAN13Barcode } = require("../utils/barcodeGenerator");

/**
 * Create a new product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createProduct = async (req, res) => {
  try {
    // Extract data from request body
    const {
      sku,
      barcode,
      name,
      description,
      category,
      price,
      cost,
      quantity,
      reorderLevel,
      active,
    } = req.body;

    // Check if product with this SKU already exists
    const existingSkuProduct = await Product.findOne({ sku });

    if (existingSkuProduct) {
      // If product exists, increment its quantity and update cost history
      existingSkuProduct.quantity += Number(quantity || 1);

      // Add to cost history
      existingSkuProduct.costHistory.push({
        cost: Number(cost),
        quantity: Number(quantity || 1),
        date: new Date(),
      });

      // Recalculate average cost
      let totalCost = 0;
      let totalQuantity = 0;

      existingSkuProduct.costHistory.forEach((entry) => {
        totalCost += entry.cost * entry.quantity;
        totalQuantity += entry.quantity;
      });

      if (totalQuantity > 0) {
        existingSkuProduct.cost = totalCost / totalQuantity;
      }

      await existingSkuProduct.save();
      return res.status(200).json(existingSkuProduct);
    }

    // Create new product with proper barcode handling
    let productBarcode = barcode;

    if (existingSkuProduct) {
      // If this is a new instance of an existing product (same SKU), use the existing barcode
      productBarcode = existingSkuProduct.barcode;
    }

    const initialQuantity = Number(quantity || 1);
    const initialCost = Number(cost);

    // Create new product
    const product = new Product({
      sku,
      barcode: productBarcode,
      name,
      description,
      category,
      price,
      cost: initialCost,
      costHistory: [
        {
          cost: initialCost,
          quantity: initialQuantity,
          date: new Date(),
        },
      ],
      quantity: initialQuantity,
      reorderLevel: reorderLevel || 10,
      active: active !== undefined ? active : true,
    });

    // Save product to database
    await product.save();

    // Return created product
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ error: messages.join(", ") });
    }

    res.status(500).json({ error: "Failed to create product" });
  }
};

/**
 * Generate a unique barcode
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.generateBarcode = async (req, res) => {
  try {
    let isUnique = false;
    let barcode;

    // Keep generating barcodes until we find a unique one
    while (!isUnique) {
      barcode = generateEAN13Barcode();

      // Check if this barcode already exists
      const existingProduct = await Product.findOne({ barcode });

      if (!existingProduct) {
        isUnique = true;
      }
    }

    res.json({ barcode });
  } catch (error) {
    console.error("Error generating barcode:", error);
    res.status(500).json({ error: "Failed to generate barcode" });
  }
};

/**
 * Export products to CSV for barcode printing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.exportProductsToCSV = async (req, res) => {
  try {
    // Get query parameters for filtering
    const { active, category } = req.query;

    // Build query based on filters
    let query = {};

    if (active === "true") {
      query.active = true;
    }

    if (category) {
      query.category = category;
    }

    // Fetch products based on query
    const products = await Product.find(query)
      .populate("category", "name")
      .lean();

    // Format data for CSV
    const csvData = products.map((product) => {
      return {
        sku: product.sku || "",
        barcode: product.barcode || "",
        name_en: product.name?.en || "",
        name_ku: product.name?.ku || "",
        category: product.category?.name?.en || "",
        price: product.price || 0,
        cost: product.cost || 0,
      };
    });

    // Convert to CSV string
    let csvString = "sku,barcode,name_en,name_ku,category,price,cost\n";

    csvData.forEach((item) => {
      csvString += `"${item.sku}","${item.barcode}","${item.name_en}","${item.name_ku}","${item.category}","${item.price}","${item.cost}"\n`;
    });

    // Set response headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=product_barcodes.csv"
    );

    // Send the CSV data
    res.send(csvString);
  } catch (error) {
    console.error("Error exporting products to CSV:", error);
    res.status(500).json({ error: "Failed to export products" });
  }
};

/**
 * Increment product quantity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.incrementQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, cost } = req.body;

    // Find the product
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Add to cost history if cost is provided
    if (cost !== undefined && Number(cost) >= 0) {
      product.costHistory.push({
        cost: Number(cost),
        quantity: Number(quantity),
        date: new Date(),
      });

      // Recalculate average cost
      let totalCost = 0;
      let totalQuantity = 0;

      product.costHistory.forEach((entry) => {
        totalCost += entry.cost * entry.quantity;
        totalQuantity += entry.quantity;
      });

      if (totalQuantity > 0) {
        product.cost = totalCost / totalQuantity;
      }
    }

    // Increment the quantity
    product.quantity += Number(quantity);
    await product.save();

    res.json(product);
  } catch (error) {
    console.error("Error incrementing product quantity:", error);
    res.status(500).json({ error: "Failed to increment product quantity" });
  }
};

/**
 * Get all products
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllProducts = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { active, category, search } = req.query;

    // Build query based on filters
    let query = {};

    if (active === "true") {
      query.active = true;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { "name.en": { $regex: search, $options: "i" } },
        { "name.ku": { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch products from database
    const products = await Product.find(query)
      .populate("category", "name")
      .sort({ createdAt: -1 });

    // Return products
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

/**
 * Search products
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.params;

    if (!query || query.length < 2) {
      return res.json([]);
    }

    // Search by name, SKU, or barcode
    const products = await Product.find({
      $or: [
        { "name.en": { $regex: query, $options: "i" } },
        { "name.ku": { $regex: query, $options: "i" } },
        { sku: { $regex: query, $options: "i" } },
        { barcode: { $regex: query, $options: "i" } },
      ],
    })
      .populate("category", "name")
      .limit(10)
      .lean();

    res.json(products);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
};

/**
 * Get a single product by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate("category", "name");

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

/**
 * Update a product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find product to update
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    console.log("Original product:", JSON.stringify(product, null, 2));

    // Update the product
    Object.keys(updateData).forEach((key) => {
      // Handle nested objects like name and description
      if (typeof updateData[key] === "object" && updateData[key] !== null) {
        if (!product[key]) product[key] = {};
        Object.keys(updateData[key]).forEach((nestedKey) => {
          product[key][nestedKey] = updateData[key][nestedKey];
        });
      } else {
        product[key] = updateData[key];
      }
    });

    console.log(
      "Updated product before save:",
      JSON.stringify(product, null, 2)
    );

    await product.save();

    console.log("Product after save:", JSON.stringify(product, null, 2));

    // Return updated product
    res.json(product);
  } catch (error) {
    console.error("Error updating product:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ error: messages.join(", ") });
    }

    res.status(500).json({ error: "Failed to update product" });
  }
};

/**
 * Delete a product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
};
