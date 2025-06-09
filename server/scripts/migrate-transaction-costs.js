const mongoose = require("mongoose");
require("dotenv").config();

const Transaction = require("../src/models/transaction.model");
const Product = require("../src/models/product.model");

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/pos-system"
    );
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

// Migration function
const migrateCosts = async () => {
  try {
    console.log("🔄 Starting cost migration for existing transactions...");

    // Find all transactions that don't have cost data in productSnapshot
    const transactions = await Transaction.find({
      "items.productSnapshot.cost": { $exists: false },
    }).select("_id items");

    console.log(
      `📊 Found ${transactions.length} transactions without cost data`
    );

    if (transactions.length === 0) {
      console.log("✅ All transactions already have cost data!");
      return;
    }

    let updatedCount = 0;
    let errorCount = 0;

    // Process transactions in batches
    const batchSize = 100;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);

      console.log(
        `📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          transactions.length / batchSize
        )}`
      );

      const bulkOps = [];

      for (const transaction of batch) {
        try {
          const updateOps = [];

          for (
            let itemIndex = 0;
            itemIndex < transaction.items.length;
            itemIndex++
          ) {
            const item = transaction.items[itemIndex];

            if (
              !item.productSnapshot ||
              item.productSnapshot.cost === undefined
            ) {
              // Look up the current product to get its cost
              const product = await Product.findById(item.product).select(
                "cost"
              );

              if (product) {
                updateOps.push({
                  [`items.${itemIndex}.productSnapshot.cost`]:
                    product.cost || 0,
                });
              } else {
                console.warn(
                  `⚠️  Product not found for ID: ${item.product} in transaction ${transaction._id}`
                );
                // Set cost to 0 for missing products
                updateOps.push({
                  [`items.${itemIndex}.productSnapshot.cost`]: 0,
                });
              }
            }
          }

          if (updateOps.length > 0) {
            // Merge all update operations for this transaction
            const mergedUpdate = updateOps.reduce(
              (acc, op) => ({ ...acc, ...op }),
              {}
            );

            bulkOps.push({
              updateOne: {
                filter: { _id: transaction._id },
                update: { $set: mergedUpdate },
              },
            });
          }
        } catch (error) {
          console.error(
            `❌ Error processing transaction ${transaction._id}:`,
            error.message
          );
          errorCount++;
        }
      }

      // Execute bulk operations
      if (bulkOps.length > 0) {
        try {
          const result = await Transaction.bulkWrite(bulkOps);
          updatedCount += result.modifiedCount;
          console.log(
            `✅ Updated ${result.modifiedCount} transactions in this batch`
          );
        } catch (error) {
          console.error("❌ Bulk write error:", error.message);
          errorCount += bulkOps.length;
        }
      }
    }

    console.log("\n📈 Migration Summary:");
    console.log(`✅ Successfully updated: ${updatedCount} transactions`);
    console.log(`❌ Errors encountered: ${errorCount} transactions`);
    console.log(`📊 Total processed: ${transactions.length} transactions`);

    // Verify the migration
    const remainingTransactions = await Transaction.countDocuments({
      "items.productSnapshot.cost": { $exists: false },
    });

    if (remainingTransactions === 0) {
      console.log(
        "🎉 Migration completed successfully! All transactions now have cost data."
      );
    } else {
      console.log(
        `⚠️  ${remainingTransactions} transactions still missing cost data. Please review.`
      );
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

// Main execution
const runMigration = async () => {
  try {
    await connectDB();
    await migrateCosts();
    console.log("🏁 Migration script completed");
  } catch (error) {
    console.error("💥 Migration script failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

// Handle script termination
process.on("SIGINT", async () => {
  console.log("\n⏹️  Migration interrupted by user");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("unhandledRejection", async (err) => {
  console.error("💥 Unhandled rejection:", err);
  await mongoose.connection.close();
  process.exit(1);
});

// Run the migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { migrateCosts, connectDB };
