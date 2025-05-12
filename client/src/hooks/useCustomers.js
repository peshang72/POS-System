import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_URL = "/api/customers";

export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all customers
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(API_URL);
      setCustomers(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch customers");
      console.error("Error fetching customers:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a new customer
  const addCustomer = async (customerData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(API_URL, customerData);
      setCustomers((prevCustomers) => [...prevCustomers, response.data]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add customer");
      console.error("Error adding customer:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing customer
  const updateCustomer = async (id, customerData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.put(`${API_URL}/${id}`, customerData);
      setCustomers((prevCustomers) =>
        prevCustomers.map((customer) =>
          customer._id === id ? response.data : customer
        )
      );
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update customer");
      console.error("Error updating customer:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a customer
  const deleteCustomer = async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      await axios.delete(`${API_URL}/${id}`);
      setCustomers((prevCustomers) =>
        prevCustomers.filter((customer) => customer._id !== id)
      );
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete customer");
      console.error("Error deleting customer:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get a single customer by ID
  const getCustomer = async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || "Failed to get customer");
      console.error("Error getting customer:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Load customers on initial render
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    isLoading,
    error,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
  };
};
