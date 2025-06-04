const mongoose = require("mongoose");
const Product = require("../src/models/product.model");
const Inventory = require("../src/models/inventory.model");
require("dotenv").config();

// Import config to use the same MongoDB URI as the server
const config = require("../src/config");

// Connect to MongoDB using the same URI as the server
mongoose
  .connect(config.mongoURI)
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Find and update Cronus Zen product
async function adjustProductQuantity() {
  try {
    // Find the product by name
    const product = await Product.findOne({ "name.en": "Cronus Zen" });

    if (!product) {
      console.error('Product "Cronus Zen" not found');
      process.exit(1);
    }

    console.log(
      `Found product: ${product.name.en}, Current quantity: ${product.quantity}`
    );

    // Create inventory adjustment record
    const adjustment = await Inventory.create({
      product: product._id,
      type: "adjustment",
      quantity: Math.max(0, product.quantity - 2), // Ensuring quantity doesn't go below 0
      remainingQuantity: Math.max(0, product.quantity - 2),
      reference: {
        type: "adjustment",
        id: new mongoose.Types.ObjectId(),
      },
      notes: "Manual adjustment to fix inventory",
      performedBy: "64f9e05eaa29a45c9c28a426", // Replace with an actual admin user ID
    });

    // No need to manually update product.quantity since the Inventory pre-save hook will handle it

    console.log(
      `Adjustment created. New quantity: ${Math.max(0, product.quantity - 2)}`
    );
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the function
adjustProductQuantity();
