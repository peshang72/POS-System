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
    // Reverse FIFO operations for all items with product references
    if (transaction.items && transaction.items.length > 0) {
      for (const item of transaction.items) {
        // Skip items without a product reference (e.g., custom items)
        if (!item.product) continue;

        console.log(
          `Reversing FIFO operations for product ${item.product}, quantity: ${item.quantity}`
        );

        // Reverse the FIFO sale operations
        await reverseFIFOSale(
          item.product,
          item.quantity,
          transaction._id,
          req.user._id,
          session
        );
      }
    }

    // Remove the transaction using the actual ObjectId
    await Transaction.findByIdAndDelete(transaction._id).session(session);

    // If customer had loyalty points from this transaction, reverse them
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

    // Prepare transaction data with FIFO costs calculated upfront
    const transactionData = { ...req.body, cashier: req.user._id };

    // Calculate FIFO costs for all items before creating the transaction
    if (transactionData.items && transactionData.items.length > 0) {
      for (const item of transactionData.items) {
        // Skip items without a product reference (e.g., custom items)
        if (!item.product) continue;

        console.log(
          `\n=== CALCULATING FIFO COST FOR PRODUCT ${item.product} ===`
        );
        console.log(`Quantity to sell: ${item.quantity}`);

        // Get FIFO cost without processing the sale yet (just for cost calculation)
        const fifoResult = await calculateFIFOCost(
          item.product,
          item.quantity,
          session
        );

        console.log(`FIFO Result:`, fifoResult);

        // Set the FIFO cost in productSnapshot before creating transaction
        if (!item.productSnapshot) {
          item.productSnapshot = {};
        }
        item.productSnapshot.cost = fifoResult.weightedAverageCost;

        console.log(
          `Set productSnapshot.cost to: ${item.productSnapshot.cost}`
        );
      }
    }

    // Create transaction with FIFO costs already set
    let transaction = await Transaction.create([transactionData], { session });
    transaction = transaction[0]; // Unwrap from array
    console.log("Transaction created successfully:", transaction._id);

    // Now process the actual inventory movements
    if (transaction.items && transaction.items.length > 0) {
      for (const item of transaction.items) {
        // Skip items without a product reference (e.g., custom items)
        if (!item.product) continue;

        // Process the actual sale and create inventory records
        await processFIFOSale(
          item.product,
          item.quantity,
          transaction._id,
          req.user._id,
          session
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

  // Get ALL purchase batches (including consumed ones) to calculate true legacy inventory
  const allPurchaseBatches = await Inventory.find({
    product: productId,
    type: "purchase",
  })
    .sort({ timestamp: 1 })
    .session(session);

  // Calculate total quantity available in tracked batches
  const totalBatchQuantity = availableBatches.reduce(
    (sum, batch) => sum + batch.remainingQuantity,
    0
  );

  // Calculate total purchased quantity from all batches
  const totalPurchasedQuantity = allPurchaseBatches.reduce(
    (sum, batch) => sum + batch.quantity,
    0
  );

  // Calculate how much should remain based on FIFO consumption of historical sales
  const totalConsumedFromBatches = totalPurchasedQuantity - totalBatchQuantity;
  const expectedRemainingQuantity =
    totalPurchasedQuantity - totalConsumedFromBatches;

  // True legacy inventory is when current quantity doesn't match expected remaining quantity
  const trueLegacyQuantity = Math.max(
    0,
    product.quantity - expectedRemainingQuantity
  );

  if (trueLegacyQuantity > 0) {
    console.log(
      `Product ${productId} has ${trueLegacyQuantity} units of true legacy inventory (untracked purchases)`
    );
    console.log(
      `  Current quantity: ${product.quantity}, Expected from batches: ${expectedRemainingQuantity}`
    );
  } else if (product.quantity !== totalBatchQuantity) {
    console.log(
      `Product ${productId}: Historical sales properly attributed to oldest batches`
    );
    console.log(
      `  Current quantity: ${product.quantity}, Available batches: ${totalBatchQuantity}`
    );
  }

  if (availableBatches.length === 0 && trueLegacyQuantity === 0) {
    // No purchase batches found and no legacy inventory, use current product cost as fallback
    return {
      weightedAverageCost: product.cost,
      totalCost: product.cost * quantityToSell,
      trueLegacyQuantityUsed: 0,
    };
  }

  let remainingToSell = quantityToSell;
  let totalCost = 0;

  // For true legacy inventory, we need to determine the cost from the oldest available batches
  // or from consumed batches if we need to reconstruct historical costs
  let legacyCost = product.cost; // fallback
  if (trueLegacyQuantity > 0) {
    // For true legacy inventory, use the weighted average of currently available batches
    // This assumes the legacy inventory has similar cost characteristics to current inventory
    if (availableBatches.length > 0) {
      const availableBatchesTotalCost = availableBatches.reduce(
        (sum, batch) =>
          sum + (batch.unitCost || product.cost) * batch.remainingQuantity,
        0
      );
      if (totalBatchQuantity > 0) {
        legacyCost = availableBatchesTotalCost / totalBatchQuantity;
      }
    }
  }

  // First, handle true legacy inventory if available
  if (trueLegacyQuantity > 0 && remainingToSell > 0) {
    const quantityFromLegacy = Math.min(remainingToSell, trueLegacyQuantity);
    const costFromLegacy = legacyCost * quantityFromLegacy;

    totalCost += costFromLegacy;
    remainingToSell -= quantityFromLegacy;

    console.log(
      `Using ${quantityFromLegacy} units from true legacy inventory at cost ${legacyCost} each`
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
    trueLegacyQuantityUsed:
      trueLegacyQuantity > 0 ? Math.min(quantityToSell, trueLegacyQuantity) : 0,
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

  // Get ALL purchase batches (including consumed ones) to calculate true legacy inventory
  const allPurchaseBatches = await Inventory.find({
    product: productId,
    type: "purchase",
  })
    .sort({ timestamp: 1 })
    .session(session);

  // Calculate total quantity available in tracked batches
  const totalBatchQuantity = availableBatches.reduce(
    (sum, batch) => sum + batch.remainingQuantity,
    0
  );

  // Calculate total purchased quantity from all batches
  const totalPurchasedQuantity = allPurchaseBatches.reduce(
    (sum, batch) => sum + batch.quantity,
    0
  );

  // Calculate how much should remain based on FIFO consumption of historical sales
  const totalConsumedFromBatches = totalPurchasedQuantity - totalBatchQuantity;
  const expectedRemainingQuantity =
    totalPurchasedQuantity - totalConsumedFromBatches;

  // True legacy inventory is when current quantity doesn't match expected remaining quantity
  const trueLegacyQuantity = Math.max(
    0,
    product.quantity - expectedRemainingQuantity
  );

  if (trueLegacyQuantity > 0) {
    console.log(
      `Product ${productId} has ${trueLegacyQuantity} units of true legacy inventory (untracked purchases)`
    );
    console.log(
      `  Current quantity: ${product.quantity}, Expected from batches: ${expectedRemainingQuantity}`
    );
  } else if (product.quantity !== totalBatchQuantity) {
    console.log(
      `Product ${productId}: Historical sales properly attributed to oldest batches`
    );
    console.log(
      `  Current quantity: ${product.quantity}, Available batches: ${totalBatchQuantity}`
    );
  }

  if (availableBatches.length === 0 && trueLegacyQuantity === 0) {
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

  // For true legacy inventory, we need to determine the cost from the oldest available batches
  // or from consumed batches if we need to reconstruct historical costs
  let legacyCost = product.cost; // fallback
  if (trueLegacyQuantity > 0) {
    // For true legacy inventory, use the weighted average of currently available batches
    // This assumes the legacy inventory has similar cost characteristics to current inventory
    if (availableBatches.length > 0) {
      const availableBatchesTotalCost = availableBatches.reduce(
        (sum, batch) =>
          sum + (batch.unitCost || product.cost) * batch.remainingQuantity,
        0
      );
      if (totalBatchQuantity > 0) {
        legacyCost = availableBatchesTotalCost / totalBatchQuantity;
      }
    }
  }

  // First, handle true legacy inventory if available
  if (trueLegacyQuantity > 0 && remainingToSell > 0) {
    const quantityFromLegacy = Math.min(remainingToSell, trueLegacyQuantity);
    const costFromLegacy = legacyCost * quantityFromLegacy;

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
      notes: `FIFO sale from true legacy inventory (untracked purchases)`,
      performedBy: userId,
    });

    console.log(
      `Using ${quantityFromLegacy} units from true legacy inventory at cost ${legacyCost} each`
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

/**
 * Reverse a FIFO sale by restoring batch quantities and removing sale records
 * This function finds all sale records created by a transaction and reverses their effects
 * @param {string} productId - The product ID
 * @param {number} quantityToReverse - Quantity to reverse (should match original sale)
 * @param {string} transactionId - Transaction ID that is being deleted
 * @param {string} userId - User performing the deletion
 * @param {object} session - MongoDB session for transaction
 * @returns {object} - Object containing reversal details
 */
async function reverseFIFOSale(
  productId,
  quantityToReverse,
  transactionId,
  userId,
  session
) {
  const Product = mongoose.model("Product");

  // Get the product
  const product = await Product.findById(productId).session(session);
  if (!product) {
    throw new Error("Product not found");
  }

  // Find all sale inventory records created by this transaction for this product
  const saleRecords = await Inventory.find({
    product: productId,
    type: "sale",
    "reference.type": "transaction",
    "reference.id": transactionId,
  }).session(session);

  if (saleRecords.length === 0) {
    console.warn(
      `No sale records found for transaction ${transactionId} and product ${productId}`
    );
    // Create a simple return record as fallback
    await Inventory.create(
      [
        {
          product: productId,
          type: "return",
          quantity: quantityToReverse,
          remainingQuantity: 0,
          reference: {
            type: "transaction",
            id: transactionId,
          },
          notes: `Transaction deletion - simple return (no FIFO records found)`,
          performedBy: userId,
        },
      ],
      { session }
    );
    return { reversalMethod: "simple", recordsReversed: 0 };
  }

  console.log(
    `Found ${saleRecords.length} sale records to reverse for transaction ${transactionId}`
  );

  let totalQuantityReversed = 0;
  const reversalDetails = [];

  // Process each sale record and reverse its effects
  for (const saleRecord of saleRecords) {
    console.log(
      `Reversing sale record: ${saleRecord.quantity} units at cost ${saleRecord.unitCost}`
    );

    // Check if this sale was from a specific batch (has notes indicating batch ID)
    if (saleRecord.notes && saleRecord.notes.includes("FIFO sale from batch")) {
      // Extract batch ID from notes (format: "FIFO sale from batch 64f...")
      const batchIdMatch = saleRecord.notes.match(
        /FIFO sale from batch ([a-f0-9]{24})/
      );

      if (batchIdMatch) {
        const batchId = batchIdMatch[1];

        // Find the batch and restore its remaining quantity
        const batch = await Inventory.findById(batchId).session(session);
        if (batch && batch.type === "purchase") {
          batch.remainingQuantity += saleRecord.quantity;
          await batch.save({ session });

          console.log(
            `Restored ${saleRecord.quantity} units to batch ${batchId}, new remaining: ${batch.remainingQuantity}`
          );

          reversalDetails.push({
            type: "batch_restoration",
            batchId: batchId,
            quantityRestored: saleRecord.quantity,
            newRemainingQuantity: batch.remainingQuantity,
          });
        } else {
          console.warn(`Batch ${batchId} not found or not a purchase record`);
        }
      }
    } else if (
      saleRecord.notes &&
      saleRecord.notes.includes("legacy inventory")
    ) {
      // This was from legacy inventory, no specific batch to restore
      console.log(`Sale was from legacy inventory, no batch to restore`);
      reversalDetails.push({
        type: "legacy_reversal",
        quantity: saleRecord.quantity,
      });
    }

    totalQuantityReversed += saleRecord.quantity;

    // Remove the sale record
    await Inventory.findByIdAndDelete(saleRecord._id).session(session);
  }

  // Restore product quantity
  product.quantity += totalQuantityReversed;
  await product.save({ session });

  console.log(`FIFO Sale reversal completed for product ${productId}:`, {
    quantityReversed: totalQuantityReversed,
    recordsReversed: saleRecords.length,
    newProductQuantity: product.quantity,
  });

  return {
    reversalMethod: "fifo",
    quantityReversed: totalQuantityReversed,
    recordsReversed: saleRecords.length,
    reversalDetails: reversalDetails,
    newProductQuantity: product.quantity,
  };
}
