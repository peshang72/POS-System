const loyaltyService = require("../services/loyaltyPoints.service");
const Transaction = require("../models/transaction.model");
const Customer = require("../models/customer.model");
const Inventory = require("../models/inventory.model");
const mongoose = require("mongoose");
const LoyaltyTransaction = require("../models/loyaltyTransaction.model");
const LoyaltySettings = require("../models/loyaltySettings.model");
const Setting = require("../models/setting.model"); // General settings model

// Utility for async error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Server Error",
      message: err.message,
    });
  });
};

/**
 * Get all transactions
 * @route GET /api/transactions
 */
exports.getTransactions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    startDate,
    endDate,
    customer,
    cashier,
    status,
  } = req.query;

  const query = {};

  // Apply filters if provided
  if (startDate && endDate) {
    query.transactionDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  if (customer) query.customer = customer;
  if (cashier) query.cashier = cashier;
  if (status) query.paymentStatus = status;

  // Pagination
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { transactionDate: -1 },
    populate: [
      { path: "customer", select: "firstName lastName phone" },
      { path: "cashier", select: "firstName lastName username" },
    ],
  };

  const transactions = await Transaction.find(query)
    .skip((options.page - 1) * options.limit)
    .limit(options.limit)
    .sort(options.sort)
    .populate(options.populate);

  const total = await Transaction.countDocuments(query);

  res.status(200).json({
    success: true,
    count: transactions.length,
    total,
    pagination: {
      page: options.page,
      limit: options.limit,
      pages: Math.ceil(total / options.limit),
    },
    data: transactions,
  });
});

/**
 * Get single transaction
 * @route GET /api/transactions/:id
 */
exports.getTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let transaction;

  // Check if the id is a valid MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
    // Search by ObjectId
    transaction = await Transaction.findById(id)
      .populate("customer")
      .populate("cashier", "firstName lastName username");
  } else {
    // Search by invoice number
    transaction = await Transaction.findOne({ invoiceNumber: id })
      .populate("customer")
      .populate("cashier", "firstName lastName username");
  }

  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: "Transaction not found",
    });
  }

  res.status(200).json({
    success: true,
    data: transaction,
  });
});

/**
 * Update transaction
 * @route PUT /api/transactions/:id
 * @access Admin only
 */
exports.updateTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Find the transaction by ObjectId or invoice number
  let transaction;
  if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
    transaction = await Transaction.findById(id);
  } else {
    transaction = await Transaction.findOne({ invoiceNumber: id });
  }

  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: "Transaction not found",
    });
  }

  // Prevent updating certain critical fields
  const restrictedFields = [
    "_id",
    "invoiceNumber",
    "cashier",
    "createdAt",
    "updatedAt",
  ];
  restrictedFields.forEach((field) => {
    if (updateData[field]) {
      delete updateData[field];
    }
  });

  // Update the transaction using the actual ObjectId
  transaction = await Transaction.findByIdAndUpdate(
    transaction._id,
    { ...updateData, updatedBy: req.user._id },
    { new: true, runValidators: true }
  )
    .populate("customer")
    .populate("cashier", "firstName lastName username");

  res.status(200).json({
    success: true,
    data: transaction,
  });
});

/**
 * Delete transaction
 * @route DELETE /api/transactions/:id
 * @access Admin only
 */
exports.deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the transaction by ObjectId or invoice number
  let transaction;
  if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
    transaction = await Transaction.findById(id);
  } else {
    transaction = await Transaction.findOne({ invoiceNumber: id });
  }

  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: "Transaction not found",
    });
  }

  // Check if transaction has been refunded - might want to prevent deletion
  if (transaction.refunded) {
    return res.status(400).json({
      success: false,
      error: "Cannot delete a refunded transaction",
    });
  }

  // Start a session for transaction safety
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Restore inventory quantities for all items with product references
    if (transaction.items && transaction.items.length > 0) {
      for (const item of transaction.items) {
        // Skip items without a product reference (e.g., custom items)
        if (!item.product) continue;

        // Create inventory record for return (this will restore the quantity)
        await Inventory.create(
          [
            {
              product: item.product,
              type: "return",
              quantity: item.quantity,
              remainingQuantity: 0, // Will be calculated in the model
              reference: {
                type: "transaction",
                id: transaction._id,
              },
              notes: `Transaction ${transaction.invoiceNumber} deleted - inventory restored`,
              performedBy: req.user._id,
            },
          ],
          { session }
        );
      }
    }

    // Remove the transaction using the actual ObjectId
    await Transaction.findByIdAndDelete(transaction._id).session(session);

    // Optionally, you might want to reverse inventory changes here
    // This depends on your business logic requirements

    // If customer had loyalty points from this transaction, you might want to deduct them
    if (transaction.customer && transaction.loyaltyPointsAwarded) {
      const customer = await Customer.findById(transaction.customer).session(
        session
      );
      if (
        customer &&
        customer.loyaltyPoints >= transaction.loyaltyPointsAwarded
      ) {
        try {
          await loyaltyService.awardPoints(
            customer._id,
            -transaction.loyaltyPointsAwarded,
            `Transaction ${transaction.invoiceNumber} deleted`,
            {
              type: "transaction",
              id: transaction._id,
            },
            {
              performedBy: req.user._id,
              metadata: {
                deletedTransaction: true,
              },
            }
          );
        } catch (error) {
          console.error("Error processing loyalty points deletion:", error);
          // Continue with deletion even if loyalty processing fails
        }
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

/**
 * Create a new transaction
 * @route POST /api/transactions
 */
exports.createTransaction = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log(
      "Creating transaction with data:",
      JSON.stringify(req.body, null, 2)
    );

    // Validate required fields
    if (!req.body.items || req.body.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: "Transaction must have at least one item",
      });
    }

    if (!req.body.total || req.body.total <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: "Transaction total must be greater than 0",
      });
    }

    // Create transaction
    let transaction = await Transaction.create(
      [
        {
          ...req.body,
          cashier: req.user._id,
        },
      ],
      { session }
    );

    transaction = transaction[0]; // Unwrap from array
    console.log("Transaction created successfully:", transaction._id);

    // Update product quantities and create inventory records
    if (transaction.items && transaction.items.length > 0) {
      for (const item of transaction.items) {
        // Skip items without a product reference (e.g., custom items)
        if (!item.product) continue;

        // Create inventory record for sale
        await Inventory.create(
          [
            {
              product: item.product,
              type: "sale",
              quantity: item.quantity, // Use positive quantity - model will subtract it
              remainingQuantity: 0, // Will be calculated in the model
              reference: {
                type: "transaction",
                id: transaction._id,
              },
              performedBy: req.user._id,
            },
          ],
          { session }
        );
      }
    }

    // Declare customer variable outside the loyalty points section
    let customer = null;

    // Handle loyalty points if customer is provided
    if (transaction.customer) {
      console.log(
        "Processing loyalty points for customer:",
        transaction.customer
      );

      // Get category IDs for loyalty calculation
      const categories = transaction.items
        .filter((item) => item.product)
        .map((item) => item.product.category);

      // Calculate points to award
      customer = await Customer.findById(transaction.customer).session(session);

      if (customer) {
        console.log("Customer found:", customer.firstName, customer.lastName);

        // Calculate points based on total amount
        const pointsToAward = await loyaltyService.calculatePointsForPurchase(
          transaction.total,
          customer,
          {
            categories: Array.from(new Set(categories.filter((c) => c))), // Unique, non-null categories
          }
        );

        console.log("Points to award:", pointsToAward);

        // If points should be awarded
        if (pointsToAward > 0) {
          // Award points to customer
          await loyaltyService.awardPoints(
            customer._id,
            pointsToAward,
            "Purchase transaction",
            {
              type: "transaction",
              id: transaction._id,
            },
            {
              performedBy: req.user._id,
              metadata: {
                transactionTotal: transaction.total,
                items: transaction.items.length,
              },
            }
          );

          // Add points info to transaction response
          transaction = transaction.toObject();
          transaction.loyaltyPointsAwarded = pointsToAward;
        }

        // Update customer purchase stats
        if (customer.updatePurchaseStats) {
          await customer.updatePurchaseStats(transaction.total);
        } else {
          // Manual update if method not available
          customer.totalSpent = (customer.totalSpent || 0) + transaction.total;
          customer.purchaseCount = (customer.purchaseCount || 0) + 1;
          customer.lastPurchase = new Date();
          await customer.save({ session });
        }
      } else {
        console.log("Customer not found for ID:", transaction.customer);
      }
    }

    // Process loyalty redemption if included
    if (req.body.loyaltyDiscount && req.body.loyaltyDiscount > 0 && customer) {
      console.log("Processing loyalty redemption:", req.body.loyaltyDiscount);

      // Get redemption rate to calculate points
      const loyaltySettings = await LoyaltySettings.findOne();
      const redemptionRate = loyaltySettings?.redemptionRate || 0.01;
      const pointsRedeemed = Math.round(
        req.body.loyaltyDiscount / redemptionRate
      );

      // Add loyalty redemption data to transaction
      transaction.loyaltyDiscount = req.body.loyaltyDiscount;
      transaction.loyaltyPointsRedeemed = pointsRedeemed;

      // Record the loyalty transaction
      await LoyaltyTransaction.create({
        customer: customer._id,
        points: -pointsRedeemed, // Negative points for redemption
        type: "redeem",
        pointsBalance: customer.loyaltyPoints - pointsRedeemed,
        reference: {
          type: "transaction",
          id: transaction._id,
        },
        reason: `Points redeemed for discount on transaction ${transaction._id}`,
        value: req.body.loyaltyDiscount,
        performedBy: req.user._id,
      });
    }

    await session.commitTransaction();
    session.endSession();

    console.log("Transaction completed successfully");

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error creating transaction:", error);
    console.error("Error stack:", error.stack);

    res.status(500).json({
      success: false,
      error: "Server Error",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

/**
 * Process a refund
 * @route POST /api/transactions/:id/refund
 */
exports.processRefund = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason, items } = req.body;

    // Find the transaction
    const transaction = await Transaction.findById(id).session(session);

    if (!transaction) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    // Check if already refunded
    if (transaction.refunded) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: "Transaction has already been refunded",
      });
    }

    // Process full or partial refund
    let refundAmount = 0;

    if (items && items.length > 0) {
      // Partial refund - validate items
      for (const refundItem of items) {
        const originalItem = transaction.items.find(
          (item) => item._id.toString() === refundItem.itemId
        );

        if (!originalItem) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            error: `Item with ID ${refundItem.itemId} not found in transaction`,
          });
        }

        if (refundItem.quantity > originalItem.quantity) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            error: `Cannot refund more than original quantity for item ${refundItem.itemId}`,
          });
        }

        // Calculate refund amount for this item
        const itemRefundAmount =
          (originalItem.subtotal / originalItem.quantity) * refundItem.quantity;
        refundAmount += itemRefundAmount;

        // Process inventory return if product exists
        if (originalItem.product) {
          await Inventory.create(
            [
              {
                product: originalItem.product,
                type: "return",
                quantity: refundItem.quantity,
                remainingQuantity: 0, // Will be calculated in the model
                reference: {
                  type: "transaction",
                  id: transaction._id,
                },
                notes: `Refund: ${reason || "Customer request"}`,
                performedBy: req.user._id,
              },
            ],
            { session }
          );
        }
      }
    } else {
      // Full refund
      refundAmount = transaction.total;

      // Process inventory return for all items with product references
      for (const item of transaction.items) {
        if (item.product) {
          await Inventory.create(
            [
              {
                product: item.product,
                type: "return",
                quantity: item.quantity,
                remainingQuantity: 0, // Will be calculated in the model
                reference: {
                  type: "transaction",
                  id: transaction._id,
                },
                notes: `Full refund: ${reason || "Customer request"}`,
                performedBy: req.user._id,
              },
            ],
            { session }
          );
        }
      }
    }

    // If customer has loyalty points from this transaction, deduct them
    if (transaction.customer && transaction.loyaltyPointsAwarded) {
      const customer = await Customer.findById(transaction.customer).session(
        session
      );

      if (
        customer &&
        customer.loyaltyPoints >= transaction.loyaltyPointsAwarded
      ) {
        // Create loyalty transaction record for point deduction
        const pointsToDeduct = transaction.loyaltyPointsAwarded;

        try {
          await loyaltyService.awardPoints(
            customer._id,
            -pointsToDeduct,
            `Refund of transaction ${transaction._id}`,
            {
              type: "transaction",
              id: transaction._id,
            },
            {
              performedBy: req.user._id,
              metadata: {
                refundAmount,
              },
            }
          );
        } catch (error) {
          console.error("Error processing loyalty points refund:", error);
          // Continue with the refund even if loyalty processing fails
        }
      }
    }

    // Update transaction
    transaction.refunded = true;
    transaction.refundReason = reason || "Customer request";
    transaction.refundDate = new Date();
    transaction.refundedBy = req.user._id;
    transaction.refundAmount = refundAmount;

    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error processing refund:", error);
    res.status(500).json({
      success: false,
      error: "Server Error",
      message: error.message,
    });
  }
});

/**
 * Redeem loyalty points for a discount
 * @route POST /api/transactions/redeem
 */
exports.redeemLoyaltyPoints = asyncHandler(async (req, res) => {
  const { customerId, pointsToRedeem, transactionId } = req.body;

  if (!customerId || !pointsToRedeem || pointsToRedeem <= 0) {
    return res.status(400).json({
      success: false,
      error: "Customer ID and points to redeem are required",
    });
  }

  // Get customer
  const customer = await Customer.findById(customerId);

  if (!customer) {
    return res.status(404).json({
      success: false,
      error: "Customer not found",
    });
  }

  // Check if customer has enough points
  if (customer.loyaltyPoints < pointsToRedeem) {
    return res.status(400).json({
      success: false,
      error: "Customer does not have enough loyalty points",
    });
  }

  // Get settings to determine point value
  const settings = (await LoyaltySettings.findOne()) || {
    redemptionRate: 0.01,
  };

  // Calculate monetary value of points
  const monetaryValue = pointsToRedeem * settings.redemptionRate;

  // Update customer's points
  customer.loyaltyPoints -= pointsToRedeem;
  await customer.save();

  // Create loyalty transaction record
  await LoyaltyTransaction.create({
    customer: customerId,
    points: -pointsToRedeem,
    type: "redemption",
    transaction: transactionId,
    monetaryValue,
  });

  res.status(200).json({
    success: true,
    data: {
      customer,
      redemption: {
        points: pointsToRedeem,
        value: monetaryValue,
      },
      monetaryValue,
    },
  });
});

// Helper function to update customer loyalty points
async function updateCustomerLoyaltyPoints(
  customerId,
  points,
  transactionId,
  isRefund = false
) {
  const customer = await Customer.findById(customerId);

  if (customer) {
    // Update points
    customer.loyaltyPoints += points;
    if (customer.loyaltyPoints < 0) customer.loyaltyPoints = 0;
    await customer.save();

    // Create loyalty transaction record
    await LoyaltyTransaction.create({
      customer: customerId,
      points,
      type: isRefund ? "refund" : "earn",
      transaction: transactionId,
    });
  }
}
