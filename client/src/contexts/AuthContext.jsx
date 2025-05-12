import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

// Improved check for running in Electron - must match apiConfig.js
const isElectron = () => {
  return Boolean(
    (window && window.process && window.process.type) ||
      window.navigator.userAgent.includes("Electron")
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
        // For Electron desktop app, auto-authenticate if no token
        if (isElectron()) {
          console.log("Running in Electron, setting default authentication");
          setIsAuthenticated(true);
          setUser({
            id: "desktop-user",
            name: "Desktop User",
            role: "admin",
            languagePreference: "en",
          });
          setLoading(false);
          return;
        }
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
        // For Electron, auto-authenticate even on error
        if (isElectron()) {
          console.log("Authentication error in Electron, using default auth");
          setIsAuthenticated(true);
          setUser({
            id: "desktop-user",
            name: "Desktop User",
            role: "admin",
            languagePreference: "en",
          });
        } else {
          logout();
          setError(error.response?.data?.message || "Authentication error");
        }
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

    // For Electron desktop app, bypass actual login
    if (isElectron()) {
      console.log("Login in Electron environment, bypassing authentication");
      const userData = {
        id: "desktop-user",
        name: "Desktop User",
        role: "admin",
        languagePreference: "en",
      };

      localStorage.setItem("token", "desktop-token");
      setToken("desktop-token");
      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
      return true;
    }

    try {
      // Use the correct URL with base URL already configured by apiConfig.js
      const url = isElectron()
        ? "http://localhost:5000/api/auth/login"
        : "/api/auth/login";

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
      setError(error.response?.data?.message || "Login failed");
      setLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);

    // For Electron, just clear local state
    if (isElectron()) {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
