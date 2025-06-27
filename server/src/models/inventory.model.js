const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    type: {
      type: String,
      enum: ["purchase", "sale", "adjustment", "return", "transfer"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    remainingQuantity: {
      type: Number,
      required: true,
    },
    unitCost: {
      type: Number,
      min: [0, "Unit cost must be positive"],
    },
    reference: {
      type: {
        type: String,
        enum: ["transaction", "purchase", "adjustment"],
      },
      id: mongoose.Schema.Types.ObjectId,
    },
    notes: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Pre-save hook to update product quantity
InventorySchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const Product = mongoose.model("Product");
    const product = await Product.findById(this.product);

    if (!product) {
      return next(new Error("Product not found"));
    }

    // Update product quantity based on inventory movement type
    // Note: Sales are now handled by FIFO logic in transaction controller
    switch (this.type) {
      case "purchase":
        product.quantity += this.quantity;
        // For purchases, set remainingQuantity to the full quantity
        this.remainingQuantity = this.quantity;
        break;
      case "return":
        product.quantity += this.quantity;
        break;
      case "sale":
        // Sales quantity updates are now handled by FIFO logic
        // Don't update product quantity here to avoid double-counting
        break;
      case "transfer":
        product.quantity -= this.quantity;
        break;
      case "adjustment":
        // Adjustment sets the absolute value
        product.quantity = this.quantity;
        this.remainingQuantity = this.quantity;
        break;
    }

    // Ensure quantity doesn't go below zero
    if (product.quantity < 0) {
      product.quantity = 0;
    }

    await product.save();
    next();
  } catch (err) {
    next(err);
  }
});

// Static method to get inventory history for a product
InventorySchema.statics.getProductHistory = async function (productId) {
  return this.find({ product: productId })
    .sort({ timestamp: -1 })
    .populate("performedBy", "firstName lastName username");
};

// Static method to update inventory for a sale
InventorySchema.statics.processSale = async function (
  productId,
  quantity,
  transactionId,
  userId
) {
  return this.create({
    product: productId,
    type: "sale",
    quantity: quantity,
    remainingQuantity: 0,
    reference: {
      type: "transaction",
      id: transactionId,
    },
    performedBy: userId,
  });
};

// Static method to update inventory for a purchase
InventorySchema.statics.processPurchase = async function (
  productId,
  quantity,
  unitCost,
  referenceId,
  userId,
  notes
) {
  return this.create({
    product: productId,
    type: "purchase",
    quantity: quantity,
    remainingQuantity: quantity,
    unitCost: unitCost,
    reference: {
      type: "purchase",
      id: referenceId,
    },
    notes: notes,
    performedBy: userId,
  });
};

// Indexes for quick querying
InventorySchema.index({ product: 1 });
InventorySchema.index({ type: 1 });
InventorySchema.index({ timestamp: -1 });
InventorySchema.index({ performedBy: 1 });
InventorySchema.index({ "reference.id": 1 });

module.exports = mongoose.model("Inventory", InventorySchema);
