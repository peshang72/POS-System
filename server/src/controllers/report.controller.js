const mongoose = require("mongoose");
const Transaction = require("../models/transaction.model");
const Product = require("../models/product.model");
const Inventory = require("../models/inventory.model");
const User = require("../models/user.model");
const Customer = require("../models/customer.model");
const StaffActivity = require("../models/staffActivity.model");

/**
 * @desc    Get sales report
 * @route   GET /api/reports/sales
 * @access  Private
 */
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Parse dates and set time to beginning and end of day
    const parsedStartDate = new Date(startDate);
    parsedStartDate.setHours(0, 0, 0, 0);

    const parsedEndDate = new Date(endDate);
    parsedEndDate.setHours(23, 59, 59, 999);

    // Build match query for date range
    const matchQuery = {
      transactionDate: {
        $gte: parsedStartDate,
        $lte: parsedEndDate,
      },
      refunded: false, // Exclude refunded transactions
    };

    // Summary: total sales, transactions, AVG order value, gross profit
    const summaryData = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total" },
          totalTransactions: { $sum: 1 },
          // Calculate approximate profit (this would need to be refined based on actual cost data)
          grossProfit: {
            $sum: {
              $multiply: [
                "$total",
                0.3, // Assuming 30% profit margin - this should be refined
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalSales: 1,
          totalTransactions: 1,
          averageOrderValue: {
            $divide: ["$totalSales", { $max: ["$totalTransactions", 1] }],
          },
          grossProfit: 1,
        },
      },
    ]);

    // Sales by date
    const salesByDate = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$transactionDate" },
          },
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          total: 1,
          count: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Top selling products
    const topProducts = await Transaction.aggregate([
      { $match: matchQuery },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.productSnapshot.name" },
          sku: { $first: "$items.productSnapshot.sku" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: 1,
          sku: 1,
          quantity: 1,
          revenue: 1,
          profit: { $multiply: ["$revenue", 0.3] }, // Approximate profit calculation
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    // Payment method distribution
    const paymentMethods = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          total: { $sum: "$total" },
        },
      },
      {
        $project: {
          _id: 0,
          method: "$_id",
          count: 1,
          total: 1,
          percentage: {
            $multiply: [
              {
                $divide: [
                  "$count",
                  { $literal: summaryData[0]?.totalTransactions || 1 },
                ],
              },
              100,
            ],
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: summaryData.length
          ? summaryData[0]
          : {
              totalSales: 0,
              totalTransactions: 0,
              averageOrderValue: 0,
              grossProfit: 0,
            },
        salesByDate,
        topProducts,
        paymentMethods,
      },
    });
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).json({
      success: false,
      message: "Error generating sales report",
      error: error.message,
    });
  }
};

/**
 * @desc    Get inventory report
 * @route   GET /api/reports/inventory
 * @access  Private
 */
exports.getInventoryReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Parse dates for filtering
    const parsedStartDate = new Date(startDate);
    parsedStartDate.setHours(0, 0, 0, 0);

    const parsedEndDate = new Date(endDate);
    parsedEndDate.setHours(23, 59, 59, 999);

    // Inventory Summary Statistics
    const inventorySummary = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalInventoryValue: {
            $sum: { $multiply: ["$price", "$quantity"] },
          },
          totalInventoryCost: {
            $sum: { $multiply: ["$cost", "$quantity"] },
          },
          lowStockItems: {
            $sum: {
              $cond: [{ $lte: ["$quantity", "$reorderLevel"] }, 1, 0],
            },
          },
          outOfStockItems: {
            $sum: {
              $cond: [{ $eq: ["$quantity", 0] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalProducts: 1,
          totalQuantity: 1,
          totalInventoryValue: 1,
          totalInventoryCost: 1,
          lowStockItems: 1,
          outOfStockItems: 1,
        },
      },
    ]);

    // Inventory Value by Category
    const categoryInventory = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$category",
          categoryName: { $first: "$categoryDetails.name" },
          productCount: { $sum: 1 },
          inventoryValue: {
            $sum: { $multiply: ["$price", "$quantity"] },
          },
          inventoryCost: {
            $sum: { $multiply: ["$cost", "$quantity"] },
          },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      {
        $project: {
          _id: 0,
          categoryId: "$_id",
          categoryName: 1,
          productCount: 1,
          inventoryValue: 1,
          inventoryCost: 1,
          totalQuantity: 1,
        },
      },
      { $sort: { inventoryValue: -1 } },
    ]);

    // Low Stock Items
    const lowStockItems = await Product.aggregate([
      {
        $match: {
          $expr: {
            $lte: ["$quantity", "$lowStockThreshold"],
          },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: "$name",
          sku: "$sku",
          quantity: 1,
          lowStockThreshold: 1,
          category: "$categoryDetails.name",
        },
      },
      { $sort: { quantity: 1 } },
      { $limit: 20 },
    ]);

    // Inventory Movement for the date range
    const inventoryMovement = await Inventory.aggregate([
      {
        $match: {
          timestamp: {
            $gte: parsedStartDate,
            $lte: parsedEndDate,
          },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $lookup: {
          from: "users",
          localField: "performedBy",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          _id: 0,
          date: "$timestamp",
          productName: "$productDetails.name",
          type: 1,
          quantity: 1,
          performedBy: {
            $concat: ["$userDetails.firstName", " ", "$userDetails.lastName"],
          },
          notes: 1,
        },
      },
      { $sort: { date: -1 } },
      { $limit: 100 },
    ]);

    // Get the full list of products with their inventory details
    const productDetails = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          sku: 1,
          category: {
            _id: "$categoryDetails._id",
            name: "$categoryDetails.name",
          },
          quantity: 1,
          price: 1,
          cost: 1,
          value: { $multiply: ["$price", "$quantity"] },
          costValue: { $multiply: ["$cost", "$quantity"] },
        },
      },
      { $sort: { value: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: inventorySummary.length
          ? inventorySummary[0]
          : {
              totalProducts: 0,
              totalQuantity: 0,
              totalInventoryValue: 0,
              totalInventoryCost: 0,
              lowStockItems: 0,
              outOfStockItems: 0,
            },
        categoryInventory,
        lowStockItems,
        inventoryMovement,
        products: productDetails,
      },
    });
  } catch (error) {
    console.error("Error generating inventory report:", error);
    res.status(500).json({
      success: false,
      message: "Error generating inventory report",
      error: error.message,
    });
  }
};

/**
 * @desc    Get staff performance report
 * @route   GET /api/reports/staff
 * @access  Private
 */
exports.getStaffReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Parse dates for filtering
    const parsedStartDate = new Date(startDate);
    parsedStartDate.setHours(0, 0, 0, 0);

    const parsedEndDate = new Date(endDate);
    parsedEndDate.setHours(23, 59, 59, 999);

    // Filter transactions by date range
    const matchQuery = {
      transactionDate: {
        $gte: parsedStartDate,
        $lte: parsedEndDate,
      },
      refunded: false,
    };

    // Staff sales performance
    const staffSales = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$cashier",
          totalSales: { $sum: "$total" },
          transactionCount: { $sum: 1 },
          averageTicket: { $avg: "$total" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "staffDetails",
        },
      },
      { $unwind: "$staffDetails" },
      {
        $project: {
          _id: 0,
          staffId: "$_id",
          name: {
            $concat: ["$staffDetails.firstName", " ", "$staffDetails.lastName"],
          },
          username: "$staffDetails.username",
          totalSales: 1,
          transactionCount: 1,
          averageTicket: 1,
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    // Staff activity summary
    const staffActivity = await StaffActivity.aggregate([
      {
        $match: {
          timestamp: {
            $gte: parsedStartDate,
            $lte: parsedEndDate,
          },
        },
      },
      {
        $group: {
          _id: "$staff",
          actions: {
            $push: {
              actionType: "$actionType",
              timestamp: "$timestamp",
              resourceType: "$resourceType",
            },
          },
          loginCount: {
            $sum: {
              $cond: [{ $eq: ["$actionType", "login"] }, 1, 0],
            },
          },
          transactions: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$resourceType", "transaction"] },
                    { $eq: ["$actionType", "create"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          refunds: {
            $sum: {
              $cond: [{ $eq: ["$actionType", "refund"] }, 1, 0],
            },
          },
          productUpdates: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$resourceType", "product"] },
                    {
                      $in: ["$actionType", ["create", "update", "delete"]],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "staffDetails",
        },
      },
      { $unwind: "$staffDetails" },
      {
        $project: {
          _id: 0,
          staffId: "$_id",
          name: {
            $concat: ["$staffDetails.firstName", " ", "$staffDetails.lastName"],
          },
          username: "$staffDetails.username",
          activityCount: { $size: "$actions" },
          loginCount: 1,
          transactions: 1,
          refunds: 1,
          productUpdates: 1,
        },
      },
      { $sort: { activityCount: -1 } },
    ]);

    // Daily activity timeline for all staff
    const activityTimeline = await StaffActivity.aggregate([
      {
        $match: {
          timestamp: {
            $gte: parsedStartDate,
            $lte: parsedEndDate,
          },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            actionType: "$actionType",
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          actionType: "$_id.actionType",
          count: 1,
        },
      },
      { $sort: { date: 1, actionType: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        staffSales,
        staffActivity,
        activityTimeline,
      },
    });
  } catch (error) {
    console.error("Error generating staff report:", error);
    res.status(500).json({
      success: false,
      message: "Error generating staff report",
      error: error.message,
    });
  }
};

/**
 * @desc    Get customer report
 * @route   GET /api/reports/customers
 * @access  Private
 */
exports.getCustomerReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Parse dates for filtering
    const parsedStartDate = new Date(startDate);
    parsedStartDate.setHours(0, 0, 0, 0);

    const parsedEndDate = new Date(endDate);
    parsedEndDate.setHours(23, 59, 59, 999);

    // Filter transactions by date range
    const matchQuery = {
      transactionDate: {
        $gte: parsedStartDate,
        $lte: parsedEndDate,
      },
      refunded: false,
      customer: { $ne: null }, // Only transactions with customer data
    };

    // Customer summary
    const customerSummary = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          newCustomers: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$createdAt", parsedStartDate] },
                    { $lte: ["$createdAt", parsedEndDate] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalCustomers: 1,
          newCustomers: 1,
        },
      },
    ]);

    // Top customers by spending
    const topCustomers = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$customer",
          totalSpent: { $sum: "$total" },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: "$total" },
          lastPurchase: { $max: "$transactionDate" },
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customerDetails",
        },
      },
      { $unwind: "$customerDetails" },
      {
        $project: {
          _id: 0,
          customerId: "$_id",
          customerName: {
            $concat: [
              "$customerDetails.firstName",
              " ",
              "$customerDetails.lastName",
            ],
          },
          email: "$customerDetails.email",
          phone: "$customerDetails.phone",
          totalSpent: 1,
          orderCount: 1,
          averageOrderValue: 1,
          lastPurchase: 1,
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 20 },
    ]);

    // New customers over time
    const newCustomersOverTime = await Customer.aggregate([
      {
        $match: {
          createdAt: {
            $gte: parsedStartDate,
            $lte: parsedEndDate,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Customer purchases by product category
    const customerProductCategories = await Transaction.aggregate([
      { $match: matchQuery },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$categoryDetails._id",
          categoryName: { $first: "$categoryDetails.name" },
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
          customerCount: { $addToSet: "$customer" },
        },
      },
      {
        $project: {
          _id: 0,
          categoryId: "$_id",
          categoryName: { $ifNull: ["$categoryName", "Uncategorized"] },
          totalSold: 1,
          revenue: 1,
          uniqueCustomers: { $size: "$customerCount" },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: customerSummary.length
          ? customerSummary[0]
          : {
              totalCustomers: 0,
              newCustomers: 0,
            },
        topCustomers,
        newCustomersOverTime,
        customerProductCategories,
      },
    });
  } catch (error) {
    console.error("Error generating customer report:", error);
    res.status(500).json({
      success: false,
      message: "Error generating customer report",
      error: error.message,
    });
  }
};

/**
 * @desc    Export sales report to CSV
 * @route   GET /api/reports/sales/export/csv
 * @access  Private
 */
exports.exportSalesReportCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Implementation placeholder for CSV export
    // In a real implementation, you'd generate CSV data and set headers
    res.status(200).send("CSV export functionality to be implemented");
  } catch (error) {
    console.error("Error exporting sales report to CSV:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting sales report to CSV",
      error: error.message,
    });
  }
};

/**
 * @desc    Export sales report to PDF
 * @route   GET /api/reports/sales/export/pdf
 * @access  Private
 */
exports.exportSalesReportPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Implementation placeholder for PDF export
    // In a real implementation, you'd generate PDF data and set headers
    res.status(200).send("PDF export functionality to be implemented");
  } catch (error) {
    console.error("Error exporting sales report to PDF:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting sales report to PDF",
      error: error.message,
    });
  }
};

/**
 * @desc    Export inventory report to CSV
 * @route   GET /api/reports/inventory/export/csv
 * @access  Private
 */
exports.exportInventoryReportCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Implementation placeholder for CSV export
    res
      .status(200)
      .send("Inventory CSV export functionality to be implemented");
  } catch (error) {
    console.error("Error exporting inventory report to CSV:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting inventory report to CSV",
      error: error.message,
    });
  }
};

/**
 * @desc    Export inventory report to PDF
 * @route   GET /api/reports/inventory/export/pdf
 * @access  Private
 */
exports.exportInventoryReportPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Implementation placeholder for PDF export
    res
      .status(200)
      .send("Inventory PDF export functionality to be implemented");
  } catch (error) {
    console.error("Error exporting inventory report to PDF:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting inventory report to PDF",
      error: error.message,
    });
  }
};

/**
 * @desc    Export staff report to CSV
 * @route   GET /api/reports/staff/export/csv
 * @access  Private
 */
exports.exportStaffReportCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Implementation placeholder for CSV export
    res.status(200).send("Staff CSV export functionality to be implemented");
  } catch (error) {
    console.error("Error exporting staff report to CSV:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting staff report to CSV",
      error: error.message,
    });
  }
};

/**
 * @desc    Export staff report to PDF
 * @route   GET /api/reports/staff/export/pdf
 * @access  Private
 */
exports.exportStaffReportPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Implementation placeholder for PDF export
    res.status(200).send("Staff PDF export functionality to be implemented");
  } catch (error) {
    console.error("Error exporting staff report to PDF:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting staff report to PDF",
      error: error.message,
    });
  }
};

/**
 * @desc    Export customer report to CSV
 * @route   GET /api/reports/customers/export/csv
 * @access  Private
 */
exports.exportCustomerReportCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Implementation placeholder for CSV export
    res.status(200).send("Customer CSV export functionality to be implemented");
  } catch (error) {
    console.error("Error exporting customer report to CSV:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting customer report to CSV",
      error: error.message,
    });
  }
};

/**
 * @desc    Export customer report to PDF
 * @route   GET /api/reports/customers/export/pdf
 * @access  Private
 */
exports.exportCustomerReportPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Implementation placeholder for PDF export
    res.status(200).send("Customer PDF export functionality to be implemented");
  } catch (error) {
    console.error("Error exporting customer report to PDF:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting customer report to PDF",
      error: error.message,
    });
  }
};
