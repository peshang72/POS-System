import { useState, useEffect } from "react";
import axios from "axios";

export const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Request more transactions by increasing the limit
      const response = await axios.get("/api/transactions?limit=1000");

      if (response.data.success) {
        // Map the transactions to ensure we have the correct structure
        const mappedTransactions = (response.data.data || []).map(
          (transaction) => ({
            ...transaction,
            id: transaction.invoiceNumber || transaction._id, // Use invoiceNumber as primary id, fallback to _id
            amount: transaction.total, // Map total to amount for consistency
            date: transaction.transactionDate, // Map transactionDate to date
            status:
              transaction.paymentStatus === "paid"
                ? "Completed"
                : transaction.paymentStatus === "pending"
                ? "Pending"
                : transaction.paymentStatus === "failed"
                ? "Cancelled"
                : "Unknown",
          })
        );

        setTransactions(mappedTransactions);
      } else {
        setError(response.data.message || "Failed to fetch transactions");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "An error occurred while fetching transactions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    loading,
    error,
    refreshTransactions: fetchTransactions,
  };
};
