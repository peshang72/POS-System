const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    expenseNumber: {
      type: String,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Please add an expense title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    category: {
      type: String,
      required: [true, "Please select an expense category"],
      enum: [
        "utilities",
        "rent",
        "supplies",
        "equipment",
        "maintenance",
        "marketing",
        "transportation",
        "office",
        "professional_services",
        "insurance",
        "taxes",
        "other",
      ],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Please add an expense amount"],
      min: [0.01, "Amount must be positive"],
    },
    currency: {
      type: String,
      enum: ["USD", "IQD"],
      default: "USD",
      required: true,
    },
    exchangeRate: {
      type: Number,
      default: 1410,
      min: [0, "Exchange rate must be positive"],
    },
    amountInBaseCurrency: {
      type: Number,
      min: [0.01, "Amount in base currency must be positive"],
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cash", "card", "transfer", "check", "other"],
    },
    paymentDetails: {
      bankName: String,
      accountNumber: String,
      checkNumber: String,
      cardLast4: String,
      reference: String,
    },
    vendor: {
      name: {
        type: String,
        trim: true,
        maxlength: [100, "Vendor name cannot be more than 100 characters"],
      },
      contact: {
        phone: String,
        email: String,
        address: String,
      },
    },
    receipt: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/|\/)/i.test(v);
        },
        message: (props) => `${props.value} is not a valid URL`,
      },
    },
    expenseDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
      required: true,
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paidAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: String,
      trim: true,
      maxlength: [50, "Department name cannot be more than 50 characters"],
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [30, "Tag cannot be more than 30 characters"],
      },
    ],
    recurring: {
      isRecurring: {
        type: Boolean,
        default: false,
      },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
      },
      nextDueDate: Date,
      endDate: Date,
    },
    attachments: [
      {
        filename: String,
        url: {
          type: String,
          validate: {
            validator: function (v) {
              return /^(https?:\/\/|\/)/i.test(v);
            },
            message: (props) => `${props.value} is not a valid URL`,
          },
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot be more than 1000 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for expense age in days
ExpenseSchema.virtual("ageInDays").get(function () {
  return Math.floor((Date.now() - this.expenseDate) / (1000 * 60 * 60 * 24));
});

// Virtual for approval time in hours
ExpenseSchema.virtual("approvalTimeInHours").get(function () {
  if (!this.approvedAt) return null;
  return Math.floor((this.approvedAt - this.createdAt) / (1000 * 60 * 60));
});

// Pre-save hook to generate expense number if not provided
ExpenseSchema.pre("save", async function (next) {
  if (this.isNew && !this.expenseNumber) {
    try {
      const Expense = this.constructor;
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

      // Find the latest expense with today's date prefix
      const latestExpense = await Expense.findOne(
        { expenseNumber: new RegExp("^EXP" + dateStr) },
        { expenseNumber: 1 },
        { sort: { expenseNumber: -1 } }
      );

      let sequentialNumber = 1;
      if (latestExpense && latestExpense.expenseNumber) {
        // Extract the sequential number and increment
        const currentNumber = parseInt(
          latestExpense.expenseNumber.replace("EXP" + dateStr, ""),
          10
        );
        if (!isNaN(currentNumber)) {
          sequentialNumber = currentNumber + 1;
        }
      }

      // Format the new expense number (EXPYYYYMMDD0001)
      this.expenseNumber = `EXP${dateStr}${sequentialNumber
        .toString()
        .padStart(4, "0")}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Pre-save hook to calculate amount in base currency
ExpenseSchema.pre("save", function (next) {
  if (this.isModified("amount") || this.isModified("currency") || this.isModified("exchangeRate")) {
    if (this.currency === "IQD") {
      this.amountInBaseCurrency = this.amount / this.exchangeRate;
    } else {
      this.amountInBaseCurrency = this.amount;
    }
  }
  next();
});

// Pre-save middleware for status changes
ExpenseSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    const now = new Date();
    
    if (this.status === "approved" && !this.approvedAt) {
      this.approvedAt = now;
    }
    
    if (this.status === "rejected" && !this.rejectedAt) {
      this.rejectedAt = now;
    }
    
    if (this.status === "paid" && !this.paidAt) {
      this.paidAt = now;
    }
  }
  next();
});

// Create all necessary indexes
ExpenseSchema.index({ expenseDate: -1 });
ExpenseSchema.index({ createdAt: -1 });
ExpenseSchema.index({ createdBy: 1 });
ExpenseSchema.index({ approvedBy: 1 });
ExpenseSchema.index({ department: 1 });
ExpenseSchema.index({ tags: 1 });
ExpenseSchema.index({ "recurring.isRecurring": 1 });
ExpenseSchema.index({ "recurring.nextDueDate": 1 });
ExpenseSchema.index({ amount: -1 });
ExpenseSchema.index({ currency: 1 });
ExpenseSchema.index({ "vendor.name": "text", title: "text", description: "text" });

// Static method to get expenses by date range
ExpenseSchema.statics.getExpensesByDateRange = async function (
  startDate,
  endDate,
  options = {}
) {
  const match = {
    expenseDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  };

  // Add optional filters
  if (options.category) match.category = options.category;
  if (options.status) match.status = options.status;
  if (options.createdBy) match.createdBy = options.createdBy;
  if (options.department) match.department = options.department;

  return this.find(match)
    .populate("createdBy", "firstName lastName username")
    .populate("approvedBy", "firstName lastName username")
    .populate("paidBy", "firstName lastName username")
    .sort({ expenseDate: -1 });
};

// Static method to get expense summary by category
ExpenseSchema.statics.getExpenseSummaryByCategory = async function (
  startDate,
  endDate
) {
  return this.aggregate([
    {
      $match: {
        expenseDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
        status: { $in: ["approved", "paid"] },
      },
    },
    {
      $group: {
        _id: "$category",
        totalAmount: { $sum: "$amountInBaseCurrency" },
        count: { $sum: 1 },
        averageAmount: { $avg: "$amountInBaseCurrency" },
      },
    },
    {
      $sort: { totalAmount: -1 },
    },
  ]);
};

// Static method to get monthly expense trends
ExpenseSchema.statics.getMonthlyTrends = async function (months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return this.aggregate([
    {
      $match: {
        expenseDate: { $gte: startDate },
        status: { $in: ["approved", "paid"] },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$expenseDate" },
          month: { $month: "$expenseDate" },
        },
        totalAmount: { $sum: "$amountInBaseCurrency" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);
};

// Static method to get pending expenses count
ExpenseSchema.statics.getPendingCount = async function (userId = null) {
  const match = { status: "pending" };
  if (userId) {
    match.createdBy = userId;
  }
  return this.countDocuments(match);
};

// Static method to get recurring expenses due soon
ExpenseSchema.statics.getRecurringDueSoon = async function (days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    "recurring.isRecurring": true,
    "recurring.nextDueDate": {
      $lte: futureDate,
      $gte: new Date(),
    },
  })
    .populate("createdBy", "firstName lastName username")
    .sort({ "recurring.nextDueDate": 1 });
};

// Instance method to approve expense
ExpenseSchema.methods.approve = async function (userId) {
  if (this.status !== "pending") {
    throw new Error("Only pending expenses can be approved");
  }

  this.status = "approved";
  this.approvedBy = userId;
  this.approvedAt = new Date();

  return this.save();
};

// Instance method to reject expense
ExpenseSchema.methods.reject = async function (userId, reason) {
  if (this.status !== "pending") {
    throw new Error("Only pending expenses can be rejected");
  }

  this.status = "rejected";
  this.rejectedBy = userId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;

  return this.save();
};

// Instance method to mark as paid
ExpenseSchema.methods.markAsPaid = async function (userId) {
  if (this.status !== "approved") {
    throw new Error("Only approved expenses can be marked as paid");
  }

  this.status = "paid";
  this.paidBy = userId;
  this.paidAt = new Date();

  return this.save();
};

module.exports = mongoose.model("Expense", ExpenseSchema);
