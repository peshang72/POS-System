const mongoose = require("mongoose");

const StaffFinanceSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["expense", "loan", "repayment", "salary", "bonus"],
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount must be positive"],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware for approvedAt
StaffFinanceSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "approved" &&
    !this.approvedAt
  ) {
    this.approvedAt = new Date();
  }
  next();
});

// Index for efficient queries
StaffFinanceSchema.index({ staff: 1 });
StaffFinanceSchema.index({ type: 1 });
StaffFinanceSchema.index({ status: 1 });
StaffFinanceSchema.index({ date: -1 });
StaffFinanceSchema.index({ createdAt: -1 });

// Static method to get total outstanding loans for a staff member
StaffFinanceSchema.statics.getOutstandingLoans = async function (staffId) {
  const loans = await this.aggregate([
    {
      $match: {
        staff: mongoose.Types.ObjectId(staffId),
        status: "approved",
        $or: [{ type: "loan" }, { type: "repayment" }],
      },
    },
    {
      $group: {
        _id: null,
        totalLoans: {
          $sum: {
            $cond: [{ $eq: ["$type", "loan"] }, "$amount", 0],
          },
        },
        totalRepayments: {
          $sum: {
            $cond: [{ $eq: ["$type", "repayment"] }, "$amount", 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        outstanding: { $subtract: ["$totalLoans", "$totalRepayments"] },
      },
    },
  ]);

  return loans.length > 0 ? loans[0].outstanding : 0;
};

// Static method to get total expenses for a staff member in a date range
StaffFinanceSchema.statics.getExpensesByDateRange = async function (
  staffId,
  startDate,
  endDate
) {
  return this.aggregate([
    {
      $match: {
        staff: mongoose.Types.ObjectId(staffId),
        type: "expense",
        status: "approved",
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: "$amount" },
      },
    },
  ]);
};

module.exports = mongoose.model("StaffFinance", StaffFinanceSchema);
