const mongoose = require("mongoose");
require("dotenv").config();

async function checkDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/pos-system";
    console.log("Connecting to:", mongoUri);

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully");

    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log("Database name:", dbName);

    // List all collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log("\nCollections in database:");
    collections.forEach((collection) => {
      console.log(`  - ${collection.name}`);
    });

    // Check if transactions collection exists and count documents
    if (collections.find((c) => c.name === "transactions")) {
      const transactionCount = await mongoose.connection.db
        .collection("transactions")
        .countDocuments();
      console.log(
        `\nTransactions collection has ${transactionCount} documents`
      );

      if (transactionCount > 0) {
        // Get a sample transaction
        const sampleTransaction = await mongoose.connection.db
          .collection("transactions")
          .findOne();
        console.log("\nSample transaction:");
        console.log(JSON.stringify(sampleTransaction, null, 2));
      }
    } else {
      console.log("\nTransactions collection does not exist");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

// Run the check
if (require.main === module) {
  checkDatabase();
}

module.exports = checkDatabase;
