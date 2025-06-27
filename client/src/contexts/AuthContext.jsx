import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

// Improved check for running in Electron - match the one in apiConfig.js
const isElectron = () => {
  // First check for the window.electron global
  if (window && window.api) {
    return true;
  }

  // Additional checks for Electron environment
  return Boolean(
    (window && window.process && window.process.type) ||
      window.navigator.userAgent.includes("Electron") ||
      // Additional check for contextBridge mode in newer Electron versions
      (window && window.electron) ||
      // Check for the context isolation mode
      (window && window.electronAPI)
  );
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up axios instance with token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Check user authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!token) {
        // No automatic authentication - always require login
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("/api/auth/me");

        if (response.data.success) {
          setIsAuthenticated(true);
          setUser(response.data.data);
        } else {
          // Handle invalid token
          logout();
        }
      } catch (error) {
        logout();
        setError(error.response?.data?.message || "Authentication error");
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [token]);

  // Login function
  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      // Determine the appropriate URL based on environment
      let url = "/api/auth/login";

      // Special case for Electron
      if (isElectron()) {
        url = "http://localhost:5000/api/auth/login";
      }

      // Log the URL for debugging
      console.log(`Attempting login with URL: ${url}`);
      console.log(`Current origin: ${window.location.origin}`);

      const response = await axios.post(url, {
        username,
        password,
      });

      if (response.data.success) {
        const { token: authToken, data: userData } = response.data;
        localStorage.setItem("token", authToken);

        setToken(authToken);
        setUser(userData);
        setIsAuthenticated(true);

        setLoading(false);
        return true;
      } else {
        setError(response.data.message || "Login failed");
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      // Add more detailed error information
      const errorDetails = error.response
        ? `Status: ${error.response.status}, Message: ${
            error.response.data?.message || error.response.statusText
          }`
        : error.message;
      console.error(`Login error details: ${errorDetails}`);

      setError(error.response?.data?.message || "Login failed");
      setLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);

    try {
      if (isAuthenticated) {
        await axios.post("/api/auth/logout");
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const updateUserPreferences = (preferences) => {
    setUser((prev) => ({ ...prev, ...preferences }));
  };

  // Function to refresh user data from server
  const refreshUser = async () => {
    if (!token || !isAuthenticated) {
      return;
    }

    try {
      const response = await axios.get("/api/auth/me");
      if (response.data.success) {
        setUser(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
      // Don't logout on refresh error, just log it
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        login,
        logout,
        updateUserPreferences,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
