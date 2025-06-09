# Migration Scripts

This directory contains database migration scripts for the POS system.

## Cost Migration Script

### Purpose

The `migrate-transaction-costs.js` script adds cost data to existing transactions that were created before the cost tracking feature was implemented.

### What it does

- Finds all transactions without cost data in `productSnapshot`
- Looks up current product costs from the Product collection
- Updates transaction items with the cost data
- Processes transactions in batches for better performance
- Provides detailed progress reporting

### How to run

#### Option 1: Using npm script (Recommended)

```bash
cd server
npm run migrate:costs
```

#### Option 2: Direct execution

```bash
cd server
node scripts/migrate-transaction-costs.js
```

### Prerequisites

- MongoDB database must be running
- Ensure `MONGODB_URI` environment variable is set, or it will default to `mongodb://localhost:27017/pos-system`
- Make sure no other processes are heavily using the database during migration

### What to expect

The script will:

1. Connect to the database
2. Find transactions without cost data
3. Process them in batches of 100
4. Show progress for each batch
5. Provide a summary of results
6. Verify the migration completed successfully

### Sample Output

```
✅ MongoDB Connected
🔄 Starting cost migration for existing transactions...
📊 Found 250 transactions without cost data
📦 Processing batch 1/3
✅ Updated 100 transactions in this batch
📦 Processing batch 2/3
✅ Updated 100 transactions in this batch
📦 Processing batch 3/3
✅ Updated 50 transactions in this batch

📈 Migration Summary:
✅ Successfully updated: 250 transactions
❌ Errors encountered: 0 transactions
📊 Total processed: 250 transactions
🎉 Migration completed successfully! All transactions now have cost data.
🏁 Migration script completed
🔌 Database connection closed
```

### Safety Features

- Uses bulk operations for better performance
- Processes in batches to avoid memory issues
- Handles missing products gracefully (sets cost to 0)
- Provides detailed error reporting
- Can be interrupted safely with Ctrl+C
- Includes verification step

### Notes

- For products that no longer exist, the cost will be set to 0
- The script uses the **current** cost of products, not historical costs
- Safe to run multiple times (idempotent)
- Does not modify existing cost data if already present

### Troubleshooting

**Database connection issues:**

- Verify MongoDB is running
- Check your `MONGODB_URI` environment variable
- Ensure network connectivity

**Memory issues with large datasets:**

- The script processes in batches of 100
- For very large datasets, you may need to adjust the `batchSize` variable

**Partial failures:**

- The script will continue processing even if some transactions fail
- Check the error logs for specific issues
- Failed transactions can be processed again by re-running the script
