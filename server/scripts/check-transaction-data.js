const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Transaction = require("../src/models/transaction.model");

async function checkTransactionData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/pos-system"
    );
    console.log("Connected to MongoDB");

    // Find a few recent transactions to inspect
    const transactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(3);

    console.log(`Found ${transactions.length} transactions to inspect`);

    for (const transaction of transactions) {
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
        } else {
          console.log(`  No productSnapshot found`);
        }
      }
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
  checkTransactionData();
}

module.exports = checkTransactionData;
