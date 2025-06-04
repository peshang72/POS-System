const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Transaction = require("../src/models/transaction.model");

async function checkSpecificTransaction() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/pos-system"
    );
    console.log("Connected to MongoDB");

    // Check total transaction count
    const totalCount = await Transaction.countDocuments();
    console.log(`Total transactions in database: ${totalCount}`);

    // Find the specific transaction from the screenshot
    let transaction = await Transaction.findOne({
      invoiceNumber: "INV-174897824358",
    });

    // If not found, get the most recent transaction
    if (!transaction) {
      transaction = await Transaction.findOne({}).sort({ createdAt: -1 });
      console.log(
        `Transaction INV-174897824358 not found, checking most recent: ${transaction?.invoiceNumber}`
      );
    }

    if (transaction) {
      console.log(`\n=== Transaction ${transaction.invoiceNumber} ===`);
      console.log(`Created: ${transaction.createdAt}`);
      console.log(`Items count: ${transaction.items.length}`);

      for (let i = 0; i < transaction.items.length; i++) {
        const item = transaction.items[i];
        console.log(`\nItem ${i}:`);
        console.log(`  Product ID: ${item.product}`);
        console.log(`  ProductSnapshot exists: ${!!item.productSnapshot}`);

        if (item.productSnapshot) {
          console.log(
            `  ProductSnapshot:`,
            JSON.stringify(item.productSnapshot, null, 4)
          );
          console.log(`  Name type: ${typeof item.productSnapshot.name}`);

          if (typeof item.productSnapshot.name === "object") {
            console.log(`  Name.en: ${item.productSnapshot.name?.en}`);
            console.log(`  Name.ku: ${item.productSnapshot.name?.ku}`);
          } else {
            console.log(`  Name (string): ${item.productSnapshot.name}`);
          }

          console.log(`  SKU: ${item.productSnapshot.sku}`);
          console.log(`  Price: ${item.productSnapshot.price}`);
        } else {
          console.log(`  No productSnapshot found`);
        }
      }
    } else {
      console.log("Transaction INV-174897824358 not found");

      // Find any transactions
      const anyTransactions = await Transaction.find({}).limit(5);
      console.log(`\nFound ${anyTransactions.length} transactions in total:`);
      anyTransactions.forEach((t) => {
        console.log(`  - ${t.invoiceNumber} (${t.createdAt})`);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

// Run the inspection
if (require.main === module) {
  checkSpecificTransaction();
}

module.exports = checkSpecificTransaction;
