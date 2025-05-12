import { useState, useCallback, useRef } from "react";
import axios from "axios";

export const useReports = () => {
  // Use separate state for each report type
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [staffData, setStaffData] = useState(null);
  const [customerData, setCustomerData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cache to prevent duplicate calls
  const cache = useRef({
    sales: {},
    inventory: {},
    staff: {},
    customers: {},
  });

  // Function to clear all report data when needed
  const clearAllReportData = useCallback(() => {
    setSalesData(null);
    setInventoryData(null);
    setStaffData(null);
    setCustomerData(null);
    setLoading(false);
    setError(null);
  }, []);

  // Generate cache key from filters
  const getCacheKey = (filters) => {
    return `${filters.startDate || ""}_${filters.endDate || ""}`;
  };

  // Fetch sales report with optional filters
  const fetchSalesReport = useCallback(async (filters = {}) => {
    setError(null);
    setLoading(true);
    const cacheKey = getCacheKey(filters);
    if (cache.current.sales[cacheKey]) {
      const { data, timestamp } = cache.current.sales[cacheKey];
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (timestamp > fiveMinutesAgo) {
        setSalesData(data);
        setLoading(false);
        console.log("[SalesReport] Using cached data:", data);
        return;
      }
    }
    try {
      const response = await axios.get("/api/reports/sales", {
        params: filters,
      });
      console.log("[SalesReport] API response:", response);
      if (response.data.success) {
        const responseData = response.data.data;
        setSalesData(responseData);
        cache.current.sales[cacheKey] = {
          data: responseData,
          timestamp: Date.now(),
        };
      } else {
        setError(response.data.message || "Failed to fetch sales report");
        setSalesData(null);
        console.error("[SalesReport] API error:", response.data.message);
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "An error occurred while fetching sales report"
      );
      setSalesData(null);
      console.error("[SalesReport] Exception:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch inventory report with optional filters
  const fetchInventoryReport = useCallback(async (filters = {}) => {
    setError(null);
    setLoading(true);
    const cacheKey = getCacheKey(filters);
    if (cache.current.inventory[cacheKey]) {
      const { data, timestamp } = cache.current.inventory[cacheKey];
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (timestamp > fiveMinutesAgo) {
        setInventoryData(data);
        setLoading(false);
        console.log("[InventoryReport] Using cached data:", data);
        return;
      }
    }
    try {
      const response = await axios.get("/api/reports/inventory", {
        params: filters,
      });
      console.log("[InventoryReport] API response:", response);
      if (response.data.success) {
        const responseData = response.data.data;
        setInventoryData(responseData);
        cache.current.inventory[cacheKey] = {
          data: responseData,
          timestamp: Date.now(),
        };
      } else {
        setError(response.data.message || "Failed to fetch inventory report");
        setInventoryData(null);
        console.error("[InventoryReport] API error:", response.data.message);
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "An error occurred while fetching inventory report"
      );
      setInventoryData(null);
      console.error("[InventoryReport] Exception:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch staff performance report with optional filters
  const fetchStaffReport = useCallback(async (filters = {}) => {
    setError(null);
    setLoading(true);
    const cacheKey = getCacheKey(filters);
    if (cache.current.staff[cacheKey]) {
      const { data, timestamp } = cache.current.staff[cacheKey];
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (timestamp > fiveMinutesAgo) {
        setStaffData(data);
        setLoading(false);
        console.log("[StaffReport] Using cached data:", data);
        return;
      }
    }
    try {
      const response = await axios.get("/api/reports/staff", {
        params: filters,
      });
      console.log("[StaffReport] API response:", response);
      if (response.data.success) {
        const responseData = response.data.data;
        setStaffData(responseData);
        cache.current.staff[cacheKey] = {
          data: responseData,
          timestamp: Date.now(),
        };
      } else {
        setError(response.data.message || "Failed to fetch staff report");
        setStaffData(null);
        console.error("[StaffReport] API error:", response.data.message);
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "An error occurred while fetching staff report"
      );
      setStaffData(null);
      console.error("[StaffReport] Exception:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch customer engagement report with optional filters
  const fetchCustomerReport = useCallback(async (filters = {}) => {
    setError(null);
    setLoading(true);
    const cacheKey = getCacheKey(filters);
    if (cache.current.customers[cacheKey]) {
      const { data, timestamp } = cache.current.customers[cacheKey];
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (timestamp > fiveMinutesAgo) {
        setCustomerData(data);
        setLoading(false);
        console.log("[CustomerReport] Using cached data:", data);
        return;
      }
    }
    try {
      const response = await axios.get("/api/reports/customers", {
        params: filters,
      });
      console.log("[CustomerReport] API response:", response);
      if (response.data.success) {
        const responseData = response.data.data;
        setCustomerData(responseData);
        cache.current.customers[cacheKey] = {
          data: responseData,
          timestamp: Date.now(),
        };
      } else {
        setError(response.data.message || "Failed to fetch customer report");
        setCustomerData(null);
        console.error("[CustomerReport] API error:", response.data.message);
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "An error occurred while fetching customer report"
      );
      setCustomerData(null);
      console.error("[CustomerReport] Exception:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Export report to PDF
  const exportReportToPDF = useCallback(async (reportType, filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `/api/reports/${reportType}/export/pdf`,
        {
          params: filters,
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${reportType}-report.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "An error occurred while exporting the report"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Export report to CSV
  const exportReportToCSV = useCallback(async (reportType, filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `/api/reports/${reportType}/export/csv`,
        {
          params: filters,
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${reportType}-report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "An error occurred while exporting the report"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Provide all data variables
    salesData,
    inventoryData,
    staffData,
    customerData,
    loading,
    error,
    clearAllReportData,
    fetchSalesReport,
    fetchInventoryReport,
    fetchStaffReport,
    fetchCustomerReport,
    exportReportToPDF,
    exportReportToCSV,
  };
};
