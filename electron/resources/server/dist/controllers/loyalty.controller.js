const loyaltyService = require("../services/loyaltyPoints.service");
const LoyaltyTransaction = require("../models/loyaltyTransaction.model");
const Customer = require("../models/customer.model");

/**
 * Get loyalty program settings
 * @route GET /api/loyalty/settings
 */
exports.getLoyaltySettings = async (req, res) => {
  try {
    const settings = await loyaltyService.getLoyaltySettings();
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
      message: error.message,
    });
  }
};

/**
 * Update loyalty program settings
 * @route PUT /api/loyalty/settings
 */
exports.updateLoyaltySettings = async (req, res) => {
  try {
    const updatedSettings = await loyaltyService.updateLoyaltySettings(
      req.body,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: updatedSettings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
      message: error.message,
    });
  }
};

/**
 * Get loyalty transactions for a customer
 * @route GET /api/loyalty/transactions/:customerId
 */
exports.getCustomerTransactions = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate, type, limit, page } = req.query;

    // Fetch customer to include in response
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Calculate pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Get transactions
    const transactions = await loyaltyService.getCustomerTransactions(
      customerId,
      {
        startDate,
        endDate,
        type,
        limit: limitNum,
        skip,
      }
    );

    // Get total count for pagination
    const total = await LoyaltyTransaction.countDocuments({
      customer: customerId,
    });

    res.status(200).json({
      success: true,
      data: {
        customer: {
          _id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          loyaltyPoints: customer.loyaltyPoints,
        },
        transactions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
      message: error.message,
    });
  }
};

/**
 * Manually adjust customer loyalty points
 * @route POST /api/loyalty/adjust/:customerId
 */
exports.adjustPoints = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { points, reason } = req.body;

    if (!points || !reason) {
      return res.status(400).json({
        success: false,
        error: "Please provide points and reason",
      });
    }

    // Find customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Determine if this is a deduction or addition
    const isDeduction = points < 0;

    // Check if customer has enough points for deduction
    if (isDeduction && Math.abs(points) > customer.loyaltyPoints) {
      return res.status(400).json({
        success: false,
        error: "Customer does not have enough points",
      });
    }

    // Update customer points
    customer.loyaltyPoints += points;
    await customer.save();

    // Create transaction record
    const transaction = new LoyaltyTransaction({
      customer: customerId,
      type: "adjust",
      points: points,
      pointsBalance: customer.loyaltyPoints,
      reference: {
        type: "manual",
        id: req.user._id,
      },
      reason: reason,
      performedBy: req.user._id,
    });

    await transaction.save();

    res.status(200).json({
      success: true,
      data: {
        customer: {
          _id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          loyaltyPoints: customer.loyaltyPoints,
        },
        transaction,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
      message: error.message,
    });
  }
};
