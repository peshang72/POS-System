const mongoose = require("mongoose");

const StaffActivitySchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: ["login", "logout", "create", "update", "delete", "void", "refund"],
    },
    resourceType: {
      type: String,
      enum: [
        "product",
        "transaction",
        "customer",
        "user",
        "setting",
        "category",
        "staff_finance",
      ],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
      reason: String,
    },
    ipAddress: {
      type: String,
      trim: true,
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

// Static method to log activity
StaffActivitySchema.statics.logActivity = async function (
  staffId,
  actionType,
  resourceType,
  resourceId,
  details = {},
  ipAddress = null
) {
  return this.create({
    staff: staffId,
    actionType,
    resourceType,
    resourceId,
    details,
    ipAddress,
  });
};

// Index for efficient queries
StaffActivitySchema.index({ staff: 1 });
StaffActivitySchema.index({ actionType: 1 });
StaffActivitySchema.index({ resourceType: 1 });
StaffActivitySchema.index({ resourceId: 1 });
StaffActivitySchema.index({ timestamp: -1 });

module.exports = mongoose.model("StaffActivity", StaffActivitySchema);
