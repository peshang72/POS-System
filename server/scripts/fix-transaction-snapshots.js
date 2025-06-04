const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Transaction = require("../src/models/transaction.model");
const Product = require("../src/models/product.model");

async function fixTransactionSnapshots() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/pos-system"
    );
    console.log("Connected to MongoDB");

    // Find all transactions with missing or incomplete productSnapshot data
    const transactions = await Transaction.find({
      $or: [
        { "items.productSnapshot": { $exists: false } },
        { "items.productSnapshot.name": { $exists: false } },
        { "items.productSnapshot.name": null },
        { "items.productSnapshot.name": "" },
        { "items.productSnapshot.name.en": { $exists: false } },
        { "items.productSnapshot.name.en": null },
        { "items.productSnapshot.name.en": "" },
      ],
    });

    console.log(
      `Found ${transactions.length} transactions with missing productSnapshot data`
    );

    let fixedCount = 0;
    let errorCount = 0;

    for (const transaction of transactions) {
      try {
        let needsUpdate = false;

        for (let i = 0; i < transaction.items.length; i++) {
          const item = transaction.items[i];

          // Check if productSnapshot is missing or incomplete
          if (
            !item.productSnapshot ||
            !item.productSnapshot.name ||
            (typeof item.productSnapshot.name === "object" &&
              !item.productSnapshot.name.en)
          ) {
            if (item.product) {
              console.log(
                `Fixing item ${i} in transaction ${transaction.invoiceNumber}`
              );

              // Fetch the product data
              const product = await Product.findById(item.product);

              if (product) {
                // Update the productSnapshot
                item.productSnapshot = {
                  name: product.name,
                  sku: product.sku,
                  price: product.price,
                };
                needsUpdate = true;
                console.log(
                  `  - Set productSnapshot: ${
                    product.name.en || product.name
                  } (${product.sku})`
                );
              } else {
                console.log(`  - Product not found for ID: ${item.product}`);
                // Set a default productSnapshot for missing products
                item.productSnapshot = {
                  name: { en: "Unknown Product", ku: "Unknown Product" },
                  sku: "N/A",
                  price: item.unitPrice || 0,
                };
                needsUpdate = true;
              }
            } else {
              console.log(`  - No product ID for item ${i}`);
              // Set a default productSnapshot for items without product reference
              item.productSnapshot = {
                name: { en: "Unknown Product", ku: "Unknown Product" },
                sku: "N/A",
                price: item.unitPrice || 0,
              };
              needsUpdate = true;
            }
          }
        }

        if (needsUpdate) {
          await transaction.save();
          fixedCount++;
          console.log(`✓ Fixed transaction ${transaction.invoiceNumber}`);
        }
      } catch (error) {
        console.error(
          `✗ Error fixing transaction ${transaction.invoiceNumber}:`,
          error.message
        );
        errorCount++;
      }
    }

    console.log("\n=== Migration Summary ===");
    console.log(`Total transactions processed: ${transactions.length}`);
    console.log(`Successfully fixed: ${fixedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log("Migration completed!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the migration
if (require.main === module) {
  fixTransactionSnapshots();
}

module.exports = fixTransactionSnapshots;
