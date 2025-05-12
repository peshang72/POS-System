import axios from "axios";

// Improved check for running in Electron
const isElectron = () => {
  // More robust check for Electron environment
  return Boolean(
    (window && window.process && window.process.type) ||
      window.navigator.userAgent.includes("Electron")
  );
};

// Get server URL for non-electron environments
const getServerUrl = () => {
  // For production deployments, check if we're running from the same origin as the API
  // or if we need to connect to a specific server
  const currentOrigin = window.location.origin;

  // If we're already being served from the backend server (port 5000),
  // use relative paths for API calls
  if (currentOrigin.includes(":5000") || !currentOrigin.includes("localhost")) {
    return "";
  }

  // In development, if we're on port 3000, the API is on 5000
  if (currentOrigin.includes(":3000")) {
    return currentOrigin.replace(":3000", ":5000");
  }

  // For development with Vite proxy or production with our proxy middleware
  // use relative URLs that will be handled by the proxy
  return "";
};

// Configure axios baseURL based on environment
const configureApi = () => {
  // Add request timeout to prevent hanging requests
  axios.defaults.timeout = 15000; // 15 seconds

  if (isElectron()) {
    // In Electron desktop app, set baseURL to local server with explicit http://
    axios.defaults.baseURL = "http://localhost:5000";
    console.log(
      "Running in Electron - API baseURL set to http://localhost:5000"
    );

    // Override default adapter to use HTTP even for file:// URLs
    const originalAdapter = axios.defaults.adapter;
    axios.defaults.adapter = function (config) {
      // Ensure URLs always go to http://localhost:5000
      if (config.url && config.url.startsWith("/api")) {
        config.url = `http://localhost:5000${config.url}`;
      }
      return originalAdapter(config);
    };
  } else {
    // In web app, determine appropriate baseURL
    const serverUrl = getServerUrl();
    axios.defaults.baseURL = serverUrl;
    console.log(
      `Running in browser - API baseURL set to '${
        serverUrl || "relative paths"
      }'`
    );
  }

  // Add request interceptor for debugging purposes
  axios.interceptors.request.use(
    (config) => {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error("API Request Error:", error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for debugging
  axios.interceptors.response.use(
    (response) => {
      console.log(`API Response: ${response.status} ${response.config.url}`);
      return response;
    },
    (error) => {
      console.error("API Response Error:", error);
      return Promise.reject(error);
    }
  );
};

export default configureApi;
