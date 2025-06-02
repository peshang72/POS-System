import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export const useExchangeRate = () => {
  const [exchangeRate, setExchangeRate] = useState(1450);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUserSpecific, setIsUserSpecific] = useState(false);

  const fetchExchangeRate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/settings/exchange-rate");
      setExchangeRate(response.data.data.exchangeRate);
      setIsUserSpecific(response.data.data.isUserSpecific);
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      setError(
        error.response?.data?.message || "Failed to fetch exchange rate"
      );
      // Keep default rate on error
      setExchangeRate(1450);
      setIsUserSpecific(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExchangeRate();
  }, [fetchExchangeRate]);

  return {
    exchangeRate,
    loading,
    error,
    isUserSpecific,
    refetch: fetchExchangeRate,
  };
};
