const mongoose = require("mongoose");

const AuditSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    collection: {
      type: String,
      required: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: false,
  }
);

// Static method to log document changes
AuditSchema.statics.logChange = async function (
  userId,
  action,
  collection,
  documentId,
  before,
  after,
  ipAddress
) {
  return this.create({
    user: userId,
    action,
    collection,
    documentId,
    changes: {
      before,
      after,
    },
    ipAddress,
  });
};

// Static method to get history for a document
AuditSchema.statics.getDocumentHistory = async function (
  collection,
  documentId
) {
  return this.find({ collection, documentId })
    .sort({ timestamp: -1 })
    .populate("user", "firstName lastName username");
};

// Static method to get recent actions by user
AuditSchema.statics.getUserActions = async function (userId, limit = 20) {
  return this.find({ user: userId }).sort({ timestamp: -1 }).limit(limit);
};

// Indexes for efficient queries
AuditSchema.index({ user: 1 });
AuditSchema.index({ action: 1 });
AuditSchema.index({ collection: 1 });
AuditSchema.index({ documentId: 1 });
AuditSchema.index({ timestamp: -1 });
AuditSchema.index({ "changes.before": "text", "changes.after": "text" });
AuditSchema.index({ collection: 1, documentId: 1, timestamp: -1 });

module.exports = mongoose.model("Audit", AuditSchema);
