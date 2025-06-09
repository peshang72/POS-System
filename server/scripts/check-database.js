const mongoose = require("mongoose");
const config = require("../src/config");

async function checkDatabase() {
  try {
    // Connect to MongoDB using the same config as the server
    const mongoUri = config.mongoURI;
    console.log(
      "Connecting to:",
      mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")
    ); // Hide credentials

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

      // Check how many transactions have customer data
      const transactionsWithCustomers = await mongoose.connection.db
        .collection("transactions")
        .countDocuments({ customer: { $ne: null } });

      const transactionsWithoutCustomers = await mongoose.connection.db
        .collection("transactions")
        .countDocuments({ customer: null });

      console.log(`Transactions with customers: ${transactionsWithCustomers}`);
      console.log(
        `Transactions without customers: ${transactionsWithoutCustomers}`
      );

      if (transactionCount > 0) {
        // Get a few sample transactions to check customer data
        const sampleTransactions = await mongoose.connection.db
          .collection("transactions")
          .find({})
          .limit(3)
          .toArray();

        console.log("\nSample transactions:");
        sampleTransactions.forEach((transaction, index) => {
          console.log(`\n--- Transaction ${index + 1} ---`);
          console.log(`Invoice Number: ${transaction.invoiceNumber}`);
          console.log(`Customer ID: ${transaction.customer || "null"}`);
          console.log(`Customer Type: ${typeof transaction.customer}`);
          console.log(`Total: ${transaction.total}`);
          console.log(`Date: ${transaction.transactionDate}`);
        });

        // If there are transactions with customers, show one
        if (transactionsWithCustomers > 0) {
          const transactionWithCustomer = await mongoose.connection.db
            .collection("transactions")
            .findOne({ customer: { $ne: null } });

          console.log("\n--- Sample transaction WITH customer ---");
          console.log(
            `Invoice Number: ${transactionWithCustomer.invoiceNumber}`
          );
          console.log(`Customer ID: ${transactionWithCustomer.customer}`);
          console.log(
            `Customer Type: ${typeof transactionWithCustomer.customer}`
          );
        }
      }
    } else {
      console.log("\nTransactions collection does not exist");
    }

    // Check customers collection
    if (collections.find((c) => c.name === "customers")) {
      const customerCount = await mongoose.connection.db
        .collection("customers")
        .countDocuments();
      console.log(`\nCustomers collection has ${customerCount} documents`);

      if (customerCount > 0) {
        const sampleCustomer = await mongoose.connection.db
          .collection("customers")
          .findOne();
        console.log("\nSample customer:");
        console.log(`ID: ${sampleCustomer._id}`);
        console.log(
          `Name: ${sampleCustomer.firstName} ${sampleCustomer.lastName}`
        );
        console.log(`Phone: ${sampleCustomer.phone || "N/A"}`);
      }
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
