const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please add a first name"],
      trim: true,
      maxlength: [50, "First name cannot be more than 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Please add a last name"],
      trim: true,
      maxlength: [50, "Last name cannot be more than 50 characters"],
    },
    phone: {
      type: String,
      required: [true, "Please add a phone number"],
      unique: true,
      trim: true,
      match: [
        /^(\+\d{1,3}[- ]?)?\d{10,14}$/,
        "Please add a valid phone number",
      ],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        "Please add a valid email",
      ],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: "Iraq",
      },
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: [0, "Loyalty points must be positive"],
    },
    memberSince: {
      type: Date,
      default: Date.now,
    },
    lastPurchase: {
      type: Date,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: [0, "Total spent must be positive"],
    },
    purchaseCount: {
      type: Number,
      default: 0,
      min: [0, "Purchase count must be positive"],
    },
    languagePreference: {
      type: String,
      enum: ["en", "ku"],
      default: "en",
    },
    active: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
CustomerSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for transactions
CustomerSchema.virtual("transactions", {
  ref: "Transaction",
  localField: "_id",
  foreignField: "customer",
  justOne: false,
});

// Method to update purchase stats when a transaction is completed
CustomerSchema.methods.updatePurchaseStats = async function (
  transactionAmount
) {
  this.totalSpent += transactionAmount;
  this.purchaseCount += 1;
  this.lastPurchase = new Date();
  return this.save();
};

// Index for fast search
CustomerSchema.index({
  firstName: "text",
  lastName: "text",
  phone: "text",
  email: "text",
  tags: "text",
});
CustomerSchema.index({ active: 1 });
CustomerSchema.index({ memberSince: 1 });
CustomerSchema.index({ lastPurchase: 1 });
CustomerSchema.index({ totalSpent: -1 });
CustomerSchema.index({ purchaseCount: -1 });
CustomerSchema.index({ tags: 1 });

module.exports = mongoose.model("Customer", CustomerSchema);
