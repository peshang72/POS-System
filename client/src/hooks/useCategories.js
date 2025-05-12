import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_URL = "/api/categories";

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(API_URL);
      setCategories(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch categories");
      console.error("Error fetching categories:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch category tree (hierarchical structure)
  const fetchCategoryTree = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/tree`);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch category tree");
      console.error("Error fetching category tree:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a new category
  const addCategory = async (categoryData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(API_URL, categoryData);
      setCategories((prevCategories) => [...prevCategories, response.data]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add category");
      console.error("Error adding category:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Load categories on initial render
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    fetchCategoryTree,
    addCategory,
  };
};
