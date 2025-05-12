import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_URL = "/api/auth";

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  // Fetch all users with optional filtering
  const fetchUsers = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/users`, { params });
      setUsers(response.data.data);
      setPagination(response.data.pagination);
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch users";
      setError(errorMessage);
      console.error("Error fetching users:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get a single user by ID
  const getUser = async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/users/${id}`);
      return response.data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to get user";
      setError(errorMessage);
      console.error("Error getting user:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new user
  const addUser = async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/register`, userData);
      setUsers((prevUsers) => [...prevUsers, response.data.data]);
      return response.data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to add user";
      setError(errorMessage);
      console.error("Error adding user:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user
  const updateUser = async (id, userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.put(`${API_URL}/users/${id}`, userData);
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user._id === id ? response.data.data : user))
      );
      return response.data.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to update user";
      setError(errorMessage);
      console.error("Error updating user:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      await axios.delete(`${API_URL}/users/${id}`);
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== id));
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete user";
      setError(errorMessage);
      console.error("Error deleting user:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset user password
  const resetPassword = async (id, newPassword) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.put(
        `${API_URL}/users/${id}/reset-password`,
        {
          newPassword,
        }
      );
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to reset password";
      setError(errorMessage);
      console.error("Error resetting password:", err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load users on initial render
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    pagination,
    fetchUsers,
    getUser,
    addUser,
    updateUser,
    deleteUser,
    resetPassword,
  };
};
