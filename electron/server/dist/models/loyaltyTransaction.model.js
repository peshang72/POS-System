const mongoose = require("mongoose");

const LoyaltyTransactionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["earn", "redeem", "adjust", "expire"],
      required: true,
      index: true,
    },
    points: {
      type: Number,
      required: true,
    },
    pointsBalance: {
      type: Number,
      required: true,
    },
    reference: {
      type: {
        type: String,
        enum: ["transaction", "manual", "system"],
        required: true,
      },
      id: mongoose.Schema.Types.ObjectId,
    },
    reason: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      default: 0,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("LoyaltyTransaction", LoyaltyTransactionSchema);
