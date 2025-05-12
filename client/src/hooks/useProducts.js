import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_URL = "/api/products";

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(API_URL);
      setProducts(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch products");
      console.error("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a new product
  const addProduct = async (productData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(API_URL, productData);
      setProducts((prevProducts) => [...prevProducts, response.data]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add product");
      console.error("Error adding product:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing product
  const updateProduct = async (id, productData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.put(`${API_URL}/${id}`, productData);
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product._id === id ? response.data : product
        )
      );
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update product");
      console.error("Error updating product:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Increment a product's quantity (adds to existing quantity)
  const incrementQuantity = async (id, data) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if data is a number (old format) or an object (new format with cost)
      const requestData = typeof data === "number" ? { quantity: data } : data;

      const response = await axios.patch(
        `${API_URL}/${id}/quantity`,
        requestData
      );

      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product._id === id ? response.data : product
        )
      );

      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update quantity");
      console.error("Error updating quantity:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a product
  const deleteProduct = async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      await axios.delete(`${API_URL}/${id}`);
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product._id !== id)
      );
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete product");
      console.error("Error deleting product:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get a single product by ID
  const getProduct = async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || "Failed to get product");
      console.error("Error getting product:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Search for products
  const searchProducts = async (query) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/search/${query}`);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || "Failed to search products");
      console.error("Error searching products:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Load products on initial render
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    incrementQuantity,
    deleteProduct,
    getProduct,
    searchProducts,
  };
};
