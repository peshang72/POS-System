import { useState, useEffect } from "react";
import axios from "axios";

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    todaySales: "$0",
    totalProducts: "0",
    lowStock: "0",
    activeUsers: "0",
    salesTrend: "up",
    salesPercent: "0%",
    productsTrend: "up",
    productsPercent: "0%",
    lowStockTrend: "down",
    lowStockPercent: "0%",
    usersTrend: "up",
    usersPercent: "0%",
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get("/api/dashboard");

      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        setError(response.data.message || "Failed to fetch dashboard data");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "An error occurred while fetching dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Optional: Set up a refresh interval
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  return {
    dashboardData,
    loading,
    error,
    refreshDashboard: fetchDashboardData,
  };
};
