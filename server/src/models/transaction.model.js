const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    transactionDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        productSnapshot: {
          name: {
            en: String,
            ku: String,
          },
          sku: String,
          price: Number,
        },
        quantity: {
          type: Number,
          required: true,
          min: [0.01, "Quantity must be positive"],
        },
        unitPrice: {
          type: Number,
          required: true,
          min: [0, "Unit price cannot be negative"],
        },
        discount: {
          type: Number,
          default: 0,
          min: [0, "Discount cannot be negative"],
        },
        discountType: {
          type: String,
          enum: ["percentage", "fixed"],
          default: "fixed",
        },
        subtotal: {
          type: Number,
          required: true,
          min: [0, "Subtotal cannot be negative"],
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"],
    },
    taxRate: {
      type: Number,
      default: 0,
      min: [0, "Tax rate cannot be negative"],
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: [0, "Tax amount cannot be negative"],
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, "Discount amount cannot be negative"],
    },
    discountReason: String,
    total: {
      type: Number,
      required: true,
      min: [0, "Total cannot be negative"],
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "transfer", "credit", "mixed"],
      required: true,
    },
    paymentDetails: {
      amountTendered: Number,
      change: Number,
      cardType: String,
      cardLast4: String,
      authorizationCode: String,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "pending", "failed"],
      required: true,
      default: "paid",
    },
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    register: {
      type: String,
      required: true,
    },
    refunded: {
      type: Boolean,
      default: false,
    },
    refundReason: String,
    refundDate: Date,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    refundAmount: {
      type: Number,
      min: [0, "Refund amount cannot be negative"],
    },
    loyaltyPointsAwarded: {
      type: Number,
      min: [0, "Loyalty points must be positive"],
    },
    notes: String,
    currency: {
      type: String,
      enum: ["USD", "IQD"],
      default: "USD",
    },
    exchangeRate: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate invoice number if not provided
TransactionSchema.pre("save", async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    try {
      // Generate a sequential invoice number
      const Transaction = this.constructor;
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

      // Find the latest transaction with today's date prefix
      const latestTransaction = await Transaction.findOne(
        { invoiceNumber: new RegExp("^" + dateStr) },
        { invoiceNumber: 1 },
        { sort: { invoiceNumber: -1 } }
      );

      let sequentialNumber = 1;
      if (latestTransaction && latestTransaction.invoiceNumber) {
        // Extract the sequential number and increment
        const currentNumber = parseInt(
          latestTransaction.invoiceNumber.replace(dateStr, ""),
          10
        );
        if (!isNaN(currentNumber)) {
          sequentialNumber = currentNumber + 1;
        }
      }

      // Format the new invoice number (YYYYMMDD0001)
      this.invoiceNumber = `${dateStr}${sequentialNumber.toString().padStart(4, "0")}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Pre-save hook to create product snapshots
TransactionSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("items")) {
    const Product = mongoose.model("Product");

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (!item.productSnapshot || !item.productSnapshot.name) {
        const product = await Product.findById(item.product);
        if (product) {
          item.productSnapshot = {
            name: product.name,
            sku: product.sku,
            price: product.price,
          };
        }
      }
    }
  }
  next();
});

// Pre-save hook to update calculated fields
TransactionSchema.pre("save", function (next) {
  // Recalculate item subtotals if needed
  for (const item of this.items) {
    if (
      !item.subtotal ||
      this.isModified(`items.${this.items.indexOf(item)}.quantity`) ||
      this.isModified(`items.${this.items.indexOf(item)}.unitPrice`) ||
      this.isModified(`items.${this.items.indexOf(item)}.discount`)
    ) {
      const price = item.unitPrice || 0;
      const quantity = item.quantity || 0;
      const discount = item.discount || 0;

      if (item.discountType === "percentage") {
        const discountAmount = price * quantity * (discount / 100);
        item.subtotal = price * quantity - discountAmount;
      } else {
        item.subtotal = price * quantity - discount;
      }
    }
  }

  next();
});

// Method to handle refund
TransactionSchema.methods.refund = async function (reason, userId) {
  if (this.refunded) {
    throw new Error("Transaction already refunded");
  }

  this.refunded = true;
  this.refundReason = reason;
  this.refundDate = new Date();
  this.refundedBy = userId;

  return this.save();
};

// Create all necessary indexes
TransactionSchema.index({ transactionDate: -1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ customer: 1 });
TransactionSchema.index({ cashier: 1 });
TransactionSchema.index({ paymentStatus: 1 });
TransactionSchema.index({ refunded: 1 });
TransactionSchema.index({ "items.product": 1 });

module.exports = mongoose.model("Transaction", TransactionSchema);
