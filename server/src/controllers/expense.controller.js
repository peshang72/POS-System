const Expense = require("../models/expense.model");

/**
 * @desc    Get all expenses
 * @route   GET /api/expenses
 * @access  Private
 */
exports.getExpenses = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      category,
      status,
      createdBy,
      department,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    // Build filter object
    const filter = {};

    // Date range filter
    if (startDate && endDate) {
      const parsedStartDate = new Date(startDate);
      parsedStartDate.setHours(0, 0, 0, 0);
      const parsedEndDate = new Date(endDate);
      parsedEndDate.setHours(23, 59, 59, 999);

      filter.expenseDate = {
        $gte: parsedStartDate,
        $lte: parsedEndDate,
      };
    }

    // Other filters
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (createdBy) filter.createdBy = createdBy;
    if (department) filter.department = department;

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "vendor.name": { $regex: search, $options: "i" } },
        { expenseNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with population
    const expenses = await Expense.find(filter)
      .populate("createdBy", "firstName lastName username")
      .populate("approvedBy", "firstName lastName username")
      .populate("paidBy", "firstName lastName username")
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(filter);

    res.status(200).json({
      expenses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

/**
 * @desc    Get single expense
 * @route   GET /api/expenses/:id
 * @access  Private
 */
exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("createdBy", "firstName lastName username")
      .populate("approvedBy", "firstName lastName username")
      .populate("paidBy", "firstName lastName username");

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    res.status(200).json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);

    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        error: "Invalid expense ID",
      });
    }

    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

/**
 * @desc    Create new expense
 * @route   POST /api/expenses
 * @access  Private
 */
exports.createExpense = async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const expense = new Expense(expenseData);
    await expense.save();

    // Populate the created expense
    await expense.populate([
      { path: "createdBy", select: "firstName lastName username" },
      { path: "approvedBy", select: "firstName lastName username" },
      { path: "paidBy", select: "firstName lastName username" },
    ]);

    res.status(201).json(expense);
  } catch (error) {
    console.error("Error creating expense:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create expense",
    });
  }
};

/**
 * @desc    Update expense
 * @route   PUT /api/expenses/:id
 * @access  Private
 */
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    // Check if user can edit this expense
    if (expense.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to edit this expense",
      });
    }

    // Don't allow editing if already approved or paid
    if (expense.status === "approved" || expense.status === "paid") {
      return res.status(400).json({
        success: false,
        error: "Cannot edit approved or paid expenses",
      });
    }

    // Update expense
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        expense[key] = req.body[key];
      }
    });

    await expense.save();

    // Populate the updated expense
    await expense.populate([
      { path: "createdBy", select: "firstName lastName username" },
      { path: "approvedBy", select: "firstName lastName username" },
      { path: "paidBy", select: "firstName lastName username" },
    ]);

    res.status(200).json(expense);
  } catch (error) {
    console.error("Error updating expense:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update expense",
    });
  }
};

/**
 * @desc    Delete expense
 * @route   DELETE /api/expenses/:id
 * @access  Private
 */
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    // Check if user can delete this expense
    if (expense.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this expense",
      });
    }

    // Don't allow deleting if already approved or paid
    if (expense.status === "approved" || expense.status === "paid") {
      return res.status(400).json({
        success: false,
        error: "Cannot delete approved or paid expenses",
      });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting expense:", error);

    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        error: "Invalid expense ID",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to delete expense",
    });
  }
};

/**
 * @desc    Approve expense
 * @route   PUT /api/expenses/:id/approve
 * @access  Private
 */
exports.approveExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    if (expense.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "Only pending expenses can be approved",
      });
    }

    await expense.approve(req.user._id);

    // Populate the updated expense
    await expense.populate([
      { path: "createdBy", select: "firstName lastName username" },
      { path: "approvedBy", select: "firstName lastName username" },
      { path: "paidBy", select: "firstName lastName username" },
    ]);

    res.status(200).json(expense);
  } catch (error) {
    console.error("Error approving expense:", error);
    res.status(500).json({
      success: false,
      error: "Failed to approve expense",
    });
  }
};

/**
 * @desc    Reject expense
 * @route   PUT /api/expenses/:id/reject
 * @access  Private
 */
exports.rejectExpense = async (req, res) => {
  try {
    const { reason } = req.body;
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    if (expense.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "Only pending expenses can be rejected",
      });
    }

    await expense.reject(req.user._id, reason);

    // Populate the updated expense
    await expense.populate([
      { path: "createdBy", select: "firstName lastName username" },
      { path: "approvedBy", select: "firstName lastName username" },
      { path: "paidBy", select: "firstName lastName username" },
    ]);

    res.status(200).json(expense);
  } catch (error) {
    console.error("Error rejecting expense:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reject expense",
    });
  }
};

/**
 * @desc    Mark expense as paid
 * @route   PUT /api/expenses/:id/paid
 * @access  Private
 */
exports.markAsPaid = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    if (expense.status !== "approved") {
      return res.status(400).json({
        success: false,
        error: "Only approved expenses can be marked as paid",
      });
    }

    await expense.markAsPaid(req.user._id);

    // Populate the updated expense
    await expense.populate([
      { path: "createdBy", select: "firstName lastName username" },
      { path: "approvedBy", select: "firstName lastName username" },
      { path: "paidBy", select: "firstName lastName username" },
    ]);

    res.status(200).json(expense);
  } catch (error) {
    console.error("Error marking expense as paid:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark expense as paid",
    });
  }
};

/**
 * @desc    Get expense summary
 * @route   GET /api/expenses/summary
 * @access  Private
 */
exports.getExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchQuery = {};

    if (startDate && endDate) {
      const parsedStartDate = new Date(startDate);
      parsedStartDate.setHours(0, 0, 0, 0);
      const parsedEndDate = new Date(endDate);
      parsedEndDate.setHours(23, 59, 59, 999);

      matchQuery.expenseDate = {
        $gte: parsedStartDate,
        $lte: parsedEndDate,
      };
    }

    // Get summary by category
    const summaryByCategory = await Expense.getExpenseSummaryByCategory(
      startDate || new Date(0),
      endDate || new Date()
    );

    // Get monthly trends
    const monthlyTrends = await Expense.getMonthlyTrends(12);

    // Get pending count
    const pendingCount = await Expense.getPendingCount();

    // Get recurring expenses due soon
    const recurringDueSoon = await Expense.getRecurringDueSoon(7);

    res.status(200).json({
      summaryByCategory,
      monthlyTrends,
      pendingCount,
      recurringDueSoon,
    });
  } catch (error) {
    console.error("Error fetching expense summary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch expense summary",
    });
  }
};
