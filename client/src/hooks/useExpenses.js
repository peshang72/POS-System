import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_URL = "/api/expenses";

export const useExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 0,
    total: 0,
    limit: 20,
  });

  // Fetch expenses with optional filters
  const fetchExpenses = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(API_URL, { params });
      setExpenses(response.data.expenses);
      setPagination(response.data.pagination);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to fetch expenses";
      setError(errorMessage);
      console.error("Error fetching expenses:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get a single expense by ID
  const getExpense = async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to get expense";
      setError(errorMessage);
      console.error("Error getting expense:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new expense
  const addExpense = async (expenseData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(API_URL, expenseData);
      setExpenses((prevExpenses) => [response.data, ...prevExpenses]);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to add expense";
      setError(errorMessage);
      console.error("Error adding expense:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing expense
  const updateExpense = async (id, expenseData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.put(`${API_URL}/${id}`, expenseData);
      setExpenses((prevExpenses) =>
        prevExpenses.map((expense) =>
          expense._id === id ? response.data : expense
        )
      );
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to update expense";
      setError(errorMessage);
      console.error("Error updating expense:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an expense
  const deleteExpense = async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      await axios.delete(`${API_URL}/${id}`);
      setExpenses((prevExpenses) =>
        prevExpenses.filter((expense) => expense._id !== id)
      );
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to delete expense";
      setError(errorMessage);
      console.error("Error deleting expense:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Approve an expense
  const approveExpense = async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.put(`${API_URL}/${id}/approve`);
      setExpenses((prevExpenses) =>
        prevExpenses.map((expense) =>
          expense._id === id ? response.data : expense
        )
      );
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to approve expense";
      setError(errorMessage);
      console.error("Error approving expense:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reject an expense
  const rejectExpense = async (id, reason) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.put(`${API_URL}/${id}/reject`, { reason });
      setExpenses((prevExpenses) =>
        prevExpenses.map((expense) =>
          expense._id === id ? response.data : expense
        )
      );
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to reject expense";
      setError(errorMessage);
      console.error("Error rejecting expense:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark expense as paid
  const markAsPaid = async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.put(`${API_URL}/${id}/paid`);
      setExpenses((prevExpenses) =>
        prevExpenses.map((expense) =>
          expense._id === id ? response.data : expense
        )
      );
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to mark expense as paid";
      setError(errorMessage);
      console.error("Error marking expense as paid:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get expense summary
  const getExpenseSummary = async (startDate, endDate) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/summary`, {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to fetch expense summary";
      setError(errorMessage);
      console.error("Error fetching expense summary:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    expenses,
    isLoading,
    error,
    pagination,
    fetchExpenses,
    getExpense,
    addExpense,
    updateExpense,
    deleteExpense,
    approveExpense,
    rejectExpense,
    markAsPaid,
    getExpenseSummary,
  };
};
