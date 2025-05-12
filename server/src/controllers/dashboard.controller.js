const Transaction = require("../models/transaction.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const Customer = require("../models/customer.model");
const { formatCurrency } = require("../utils/formatters");

/**
 * Get dashboard data including summary statistics and recent transactions
 */
exports.getDashboardData = async (req, res) => {
  try {
    // Define the date for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Define the date for yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Define the date for last week (7 days ago)
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Get today's sales amount
    const todaySales = await Transaction.aggregate([
      {
        $match: {
          transactionDate: { $gte: today },
          refunded: false,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);

    // Get yesterday's sales for comparison
    const yesterdaySales = await Transaction.aggregate([
      {
        $match: {
          transactionDate: {
            $gte: yesterday,
            $lt: today,
          },
          refunded: false,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);

    // Calculate sales trend
    const todaySalesAmount = todaySales.length > 0 ? todaySales[0].total : 0;
    const yesterdaySalesAmount =
      yesterdaySales.length > 0 ? yesterdaySales[0].total : 0;

    let salesTrend = "up";
    let salesPercent = "0%";

    if (yesterdaySalesAmount > 0) {
      salesTrend = todaySalesAmount >= yesterdaySalesAmount ? "up" : "down";
      const percentChange = Math.abs(
        Math.round(
          ((todaySalesAmount - yesterdaySalesAmount) / yesterdaySalesAmount) *
            100
        )
      );
      salesPercent = `${percentChange}%`;
    } else if (todaySalesAmount > 0) {
      salesTrend = "up";
      salesPercent = "100%";
    }

    // Count total products
    const totalProducts = await Product.countDocuments();

    // Count active products last week vs total for trend
    const newProductsLastWeek = await Product.countDocuments({
      createdAt: { $gte: lastWeek },
    });

    const productsTrend = newProductsLastWeek > 0 ? "up" : "flat";
    const productsPercent =
      totalProducts > 0
        ? `${Math.round((newProductsLastWeek / totalProducts) * 100)}%`
        : "0%";

    // Get products with low stock
    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ["$quantity", "$reorderLevel"] },
    });

    // Trend for low stock (decreased low stock is good, so trend is inverted)
    const lowStockLastWeek = await Product.countDocuments({
      $expr: { $lte: ["$quantity", "$reorderLevel"] },
      updatedAt: { $lte: lastWeek },
    });

    const lowStockTrend = lowStockCount <= lowStockLastWeek ? "up" : "down";
    const lowStockPercent =
      lowStockLastWeek > 0
        ? `${Math.round(Math.abs((lowStockCount - lowStockLastWeek) / lowStockLastWeek) * 100)}%`
        : "0%";

    // Count active users
    const activeUsers = await User.countDocuments({ active: true });

    // New users in last week
    const newUsersLastWeek = await User.countDocuments({
      createdAt: { $gte: lastWeek },
    });

    const usersTrend = newUsersLastWeek > 0 ? "up" : "flat";
    const usersPercent =
      activeUsers > 0
        ? `${Math.round((newUsersLastWeek / activeUsers) * 100)}%`
        : "0%";

    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ transactionDate: -1 })
      .limit(5)
      .populate("customer", "name")
      .populate("cashier", "name");

    // Format data for the frontend
    const dashboardData = {
      todaySales: formatCurrency(todaySalesAmount),
      totalProducts: totalProducts.toString(),
      lowStock: lowStockCount.toString(),
      activeUsers: activeUsers.toString(),
      salesTrend,
      salesPercent,
      productsTrend,
      productsPercent,
      lowStockTrend,
      lowStockPercent,
      usersTrend,
      usersPercent,
      recentTransactions: recentTransactions.map((transaction) => ({
        id: transaction.invoiceNumber,
        customer: transaction.customer ? transaction.customer.name : "Guest",
        cashier: transaction.cashier ? transaction.cashier.name : "Unknown",
        amount: transaction.total.toFixed(2),
        date: transaction.transactionDate,
        status:
          transaction.paymentStatus === "paid"
            ? "Completed"
            : transaction.paymentStatus === "pending"
              ? "Pending"
              : "Failed",
      })),
    };

    return res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
};
