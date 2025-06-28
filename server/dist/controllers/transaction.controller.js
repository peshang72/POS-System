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
      { path: "cashier", select: "name" },
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
  const transaction = await Transaction.findById(req.params.id)
    .populate("customer")
    .populate("cashier", "name");

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

  // Find the transaction
  let transaction = await Transaction.findById(id);

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

  // Update the transaction
  transaction = await Transaction.findByIdAndUpdate(
    id,
    { ...updateData, updatedBy: req.user._id },
    { new: true, runValidators: true }
  )
    .populate("customer")
    .populate("cashier", "name");

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

  const transaction = await Transaction.findById(id);

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

    // Remove the transaction
    await Transaction.findByIdAndDelete(id).session(session);

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

    // Handle loyalty points if customer is provided
    if (transaction.customer) {
      // Get category IDs for loyalty calculation
      const categories = transaction.items
        .filter((item) => item.product)
        .map((item) => item.product.category);

      // Calculate points to award
      const customer = await Customer.findById(transaction.customer).session(
        session
      );

      if (customer) {
        // Calculate points based on total amount
        const pointsToAward = await loyaltyService.calculatePointsForPurchase(
          transaction.total,
          customer,
          {
            categories: Array.from(new Set(categories.filter((c) => c))), // Unique, non-null categories
          }
        );

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
      }
    }

    // Process loyalty redemption if included
    if (req.body.loyaltyDiscount && req.body.loyaltyDiscount > 0 && customer) {
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

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error creating transaction:", error);
    res.status(500).json({
      success: false,
      error: "Server Error",
      message: error.message,
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

/**
 * Calculate FIFO cost without processing the sale
 * This function calculates what the FIFO cost would be without actually updating inventory
 * @param {string} productId - The product ID
 * @param {number} quantityToSell - Quantity to sell
 * @param {object} session - MongoDB session for transaction
 * @returns {object} - Object containing weighted average cost calculation
 */
async function calculateFIFOCost(productId, quantityToSell, session) {
  const Product = mongoose.model("Product");

  // Get the product to check available quantity
  const product = await Product.findById(productId).session(session);
  if (!product) {
    throw new Error("Product not found");
  }

  // Check if we have enough total quantity
  if (product.quantity < quantityToSell) {
    throw new Error(
      `Insufficient inventory. Available: ${product.quantity}, Requested: ${quantityToSell}`
    );
  }

  // Get all purchase inventory records for this product with remaining quantity > 0
  // Sort by timestamp (oldest first) for FIFO
  const availableBatches = await Inventory.find({
    product: productId,
    type: "purchase",
    remainingQuantity: { $gt: 0 },
  })
    .sort({ timestamp: 1 }) // Oldest first (FIFO)
    .session(session);

  // Calculate total quantity available in tracked batches
  const totalBatchQuantity = availableBatches.reduce(
    (sum, batch) => sum + batch.remainingQuantity,
    0
  );

  // Check if there's a discrepancy (product sold before FIFO implementation)
  const legacyQuantity = Math.max(0, product.quantity - totalBatchQuantity);

  if (legacyQuantity > 0) {
    console.log(
      `Product ${productId} has ${legacyQuantity} units of legacy inventory (sold before FIFO tracking)`
    );
  }

  if (availableBatches.length === 0 && legacyQuantity === 0) {
    // No purchase batches found and no legacy inventory, use current product cost as fallback
    return {
      weightedAverageCost: product.cost,
      totalCost: product.cost * quantityToSell,
      legacyQuantityUsed: 0,
    };
  }

  let remainingToSell = quantityToSell;
  let totalCost = 0;

  // Calculate cost of currently available batches for legacy inventory pricing
  let legacyCost = product.cost; // fallback to product cost
  if (availableBatches.length > 0) {
    // Calculate weighted average cost of available batches only
    const availableBatchesTotalCost = availableBatches.reduce(
      (sum, batch) =>
        sum + (batch.unitCost || product.cost) * batch.remainingQuantity,
      0
    );
    const availableBatchesTotalQuantity = availableBatches.reduce(
      (sum, batch) => sum + batch.remainingQuantity,
      0
    );

    if (availableBatchesTotalQuantity > 0) {
      legacyCost = availableBatchesTotalCost / availableBatchesTotalQuantity;
    }
  }

  // First, use legacy inventory (oldest conceptually) if available
  if (legacyQuantity > 0 && remainingToSell > 0) {
    const quantityFromLegacy = Math.min(remainingToSell, legacyQuantity);
    const costFromLegacy = legacyCost * quantityFromLegacy; // Use cost of available batches for legacy inventory

    totalCost += costFromLegacy;
    remainingToSell -= quantityFromLegacy;

    console.log(
      `Using ${quantityFromLegacy} units from legacy inventory at cost ${legacyCost} each (based on available batches)`
    );
  }

  // Then, calculate cost from tracked batches in FIFO order
  for (const batch of availableBatches) {
    if (remainingToSell <= 0) break;

    const availableInBatch = batch.remainingQuantity;
    const quantityFromThisBatch = Math.min(remainingToSell, availableInBatch);
    const costFromThisBatch =
      (batch.unitCost || product.cost) * quantityFromThisBatch;

    totalCost += costFromThisBatch;
    remainingToSell -= quantityFromThisBatch;
  }

  // Calculate weighted average cost
  const weightedAverageCost =
    quantityToSell > 0 ? totalCost / quantityToSell : 0;

  return {
    weightedAverageCost,
    totalCost,
    legacyQuantityUsed:
      legacyQuantity > 0 ? Math.min(quantityToSell, legacyQuantity) : 0,
  };
}

/**
 * Process a sale using FIFO (First In, First Out) inventory method
 * This function finds the oldest batches with available quantity and uses their cost
 * @param {string} productId - The product ID
 * @param {number} quantityToSell - Quantity to sell
 * @param {string} transactionId - Transaction ID for reference
 * @param {string} userId - User performing the sale
 * @param {object} session - MongoDB session for transaction
 * @returns {object} - Object containing weighted average cost and inventory records created
 */
async function processFIFOSale(
  productId,
  quantityToSell,
  transactionId,
  userId,
  session
) {
  const Product = mongoose.model("Product");

  // Get the product to check available quantity
  const product = await Product.findById(productId).session(session);
  if (!product) {
    throw new Error("Product not found");
  }

  // Check if we have enough total quantity
  if (product.quantity < quantityToSell) {
    throw new Error(
      `Insufficient inventory. Available: ${product.quantity}, Requested: ${quantityToSell}`
    );
  }

  // Get all purchase inventory records for this product with remaining quantity > 0
  // Sort by timestamp (oldest first) for FIFO
  const availableBatches = await Inventory.find({
    product: productId,
    type: "purchase",
    remainingQuantity: { $gt: 0 },
  })
    .sort({ timestamp: 1 }) // Oldest first (FIFO)
    .session(session);

  // Calculate total quantity available in tracked batches
  const totalBatchQuantity = availableBatches.reduce(
    (sum, batch) => sum + batch.remainingQuantity,
    0
  );

  // Check if there's a discrepancy (product sold before FIFO implementation)
  const legacyQuantity = Math.max(0, product.quantity - totalBatchQuantity);

  if (legacyQuantity > 0) {
    console.log(
      `Product ${productId} has ${legacyQuantity} units of legacy inventory (sold before FIFO tracking)`
    );
  }

  if (availableBatches.length === 0 && legacyQuantity === 0) {
    // No purchase batches found and no legacy inventory, use current product cost as fallback
    console.warn(
      `No purchase batches found for product ${productId}, using current product cost`
    );

    // Create a single inventory record for the sale
    await Inventory.create(
      [
        {
          product: productId,
          type: "sale",
          quantity: quantityToSell,
          remainingQuantity: 0,
          unitCost: product.cost,
          reference: {
            type: "transaction",
            id: transactionId,
          },
          performedBy: userId,
        },
      ],
      { session }
    );

    // Update product quantity
    product.quantity -= quantityToSell;
    await product.save({ session });

    return {
      weightedAverageCost: product.cost,
      batchesUsed: [],
      totalCost: product.cost * quantityToSell,
    };
  }

  let remainingToSell = quantityToSell;
  let totalCost = 0;
  const batchesUsed = [];
  const inventoryRecordsToCreate = [];

  // Calculate cost of currently available batches for legacy inventory pricing
  let legacyCost = product.cost; // fallback to product cost
  if (availableBatches.length > 0) {
    // Calculate weighted average cost of available batches only
    const availableBatchesTotalCost = availableBatches.reduce(
      (sum, batch) =>
        sum + (batch.unitCost || product.cost) * batch.remainingQuantity,
      0
    );
    const availableBatchesTotalQuantity = availableBatches.reduce(
      (sum, batch) => sum + batch.remainingQuantity,
      0
    );

    if (availableBatchesTotalQuantity > 0) {
      legacyCost = availableBatchesTotalCost / availableBatchesTotalQuantity;
    }
  }

  // First, handle legacy inventory (oldest conceptually) if available
  if (legacyQuantity > 0 && remainingToSell > 0) {
    const quantityFromLegacy = Math.min(remainingToSell, legacyQuantity);
    const costFromLegacy = legacyCost * quantityFromLegacy; // Use cost of available batches for legacy inventory

    totalCost += costFromLegacy;
    remainingToSell -= quantityFromLegacy;

    // Track legacy inventory usage
    batchesUsed.push({
      batchId: "legacy",
      quantityUsed: quantityFromLegacy,
      unitCost: legacyCost,
      batchDate: "legacy",
    });

    // Create inventory record for legacy sale
    inventoryRecordsToCreate.push({
      product: productId,
      type: "sale",
      quantity: quantityFromLegacy,
      remainingQuantity: 0,
      unitCost: legacyCost,
      reference: {
        type: "transaction",
        id: transactionId,
      },
      notes: `FIFO sale from legacy inventory (pre-FIFO tracking) - cost based on available batches`,
      performedBy: userId,
    });

    console.log(
      `Using ${quantityFromLegacy} units from legacy inventory at cost ${legacyCost} each (based on available batches)`
    );
  }

  // Then, process tracked batches in FIFO order
  for (const batch of availableBatches) {
    if (remainingToSell <= 0) break;

    const availableInBatch = batch.remainingQuantity;
    const quantityFromThisBatch = Math.min(remainingToSell, availableInBatch);
    const costFromThisBatch =
      (batch.unitCost || product.cost) * quantityFromThisBatch;

    // Update batch remaining quantity
    batch.remainingQuantity -= quantityFromThisBatch;
    await batch.save({ session });

    // Track this batch usage
    batchesUsed.push({
      batchId: batch._id,
      quantityUsed: quantityFromThisBatch,
      unitCost: batch.unitCost || product.cost,
      batchDate: batch.timestamp,
    });

    // Add to total cost
    totalCost += costFromThisBatch;
    remainingToSell -= quantityFromThisBatch;

    // Create inventory record for this portion of the sale
    inventoryRecordsToCreate.push({
      product: productId,
      type: "sale",
      quantity: quantityFromThisBatch,
      remainingQuantity: 0,
      unitCost: batch.unitCost || product.cost,
      reference: {
        type: "transaction",
        id: transactionId,
      },
      notes: `FIFO sale from batch ${batch._id}`,
      performedBy: userId,
    });
  }

  // Create all inventory records
  if (inventoryRecordsToCreate.length > 0) {
    await Inventory.create(inventoryRecordsToCreate, { session });
  }

  // Update product total quantity
  product.quantity -= quantityToSell;
  await product.save({ session });

  // Calculate weighted average cost
  const weightedAverageCost =
    quantityToSell > 0 ? totalCost / quantityToSell : 0;

  console.log(`FIFO Sale processed for product ${productId}:`, {
    quantitySold: quantityToSell,
    weightedAverageCost,
    batchesUsed: batchesUsed.length,
    totalCost,
  });

  return {
    weightedAverageCost,
    batchesUsed,
    totalCost,
    inventoryRecords: inventoryRecordsToCreate.length,
  };
}
