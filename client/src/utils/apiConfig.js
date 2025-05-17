import axios from "axios";

// Enhanced check for running in Electron
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

// Get server URL for non-electron environments
const getServerUrl = () => {
  // For production deployments, check if we're running from the same origin as the API
  // or if we need to connect to a specific server
  const currentOrigin = window.location.origin;

  // For DigitalOcean App Platform, use the explicit API URL
  if (currentOrigin.includes("ondigitalocean.app")) {
    console.log(
      "Running on DigitalOcean App Platform - Using explicit API URL"
    );
    // Check if API_URL is provided in environment variables, otherwise use current origin
    const apiUrl = process.env.API_URL || currentOrigin;
    console.log(`API URL: ${apiUrl}`);
    return ""; // Use relative URLs with proxy for API calls
  }

  // If we're in production but not DigitalOcean, use relative paths
  if (currentOrigin.includes(":5000") || !currentOrigin.includes("localhost")) {
    return "";
  }

  // In development, if we're on port 3000, the API is on 5000
  if (currentOrigin.includes(":3000")) {
    return "http://localhost:5000";
  }

  // For development with Vite proxy or production with our proxy middleware
  // use relative URLs that will be handled by the proxy
  return "";
};

// Configure axios baseURL based on environment
const configureApi = () => {
  // Add request timeout to prevent hanging requests
  axios.defaults.timeout = 30000; // 30 seconds - increased for dev environment

  // Remove default content type to let browser set it properly for form submissions
  delete axios.defaults.headers.common["Content-Type"];

  // Track failed connection attempts for retry logic
  let connectionAttempts = 0;
  const MAX_RETRY_ATTEMPTS = 3;
  let isReconnecting = false;

  // In Electron app settings
  if (isElectron()) {
    // In Electron desktop app, set baseURL to local server with explicit http://
    axios.defaults.baseURL = "http://localhost:5000";
    console.log(
      "Running in Electron - API baseURL set to http://localhost:5000"
    );

    // Add request interceptor to handle Electron specific routing
    axios.interceptors.request.use((config) => {
      // Always ensure the proper base URL for API requests in Electron
      if (config.url && config.url.startsWith("/api")) {
        config.url = `http://localhost:5000${config.url}`;
      } else if (config.url && !config.url.includes("://")) {
        // Handle relative URLs that don't start with /api
        config.url = `http://localhost:5000/${config.url.replace(/^\//, "")}`;
      }

      // Don't set content-type for multipart form data (file uploads)
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      } else if (config.method !== "get") {
        // For non-GET requests that aren't form data, set proper JSON content type
        config.headers["Content-Type"] = "application/json";
      }

      // Log full URL in development
      console.log(`Full request URL: ${config.method} ${config.url}`);

      return config;
    });

    // Add electron flag to headers for API requests
    axios.defaults.headers.common["X-Electron-App"] = "true";

    // Add electron version if available through the bridge API
    if (window.api && window.api.invoke) {
      window.api
        .invoke("get-version")
        .then((version) => {
          axios.defaults.headers.common["X-Electron-Version"] = version;
        })
        .catch((err) => {
          // Log error but continue
          console.warn("Failed to get Electron version:", err);
        });
    }

    // Add response interceptor for handling network errors in Electron
    axios.interceptors.response.use(
      (response) => {
        // Reset connection attempts on successful response
        connectionAttempts = 0;
        isReconnecting = false;
        return response;
      },
      async (error) => {
        if (
          error.code === "ECONNREFUSED" ||
          error.message.includes("Network Error") ||
          error.message.includes("timeout")
        ) {
          console.error(
            "Server connection failed. Make sure the server is running."
          );

          connectionAttempts++;
          console.log(
            `Connection attempt ${connectionAttempts} of ${MAX_RETRY_ATTEMPTS} failed`
          );

          // If we've tried and failed multiple times, attempt to restart the server
          if (connectionAttempts >= MAX_RETRY_ATTEMPTS && !isReconnecting) {
            console.log(
              "Maximum retry attempts reached, requesting server restart"
            );
            isReconnecting = true;

            if (window.api && window.api.invoke) {
              try {
                const result = await window.api.invoke("restart-server");
                console.log("Server restart requested:", result);

                // If server restart was successful, add a notification or update UI here
                if (result && result.success) {
                  console.log(
                    "Server restarted successfully, retrying connection..."
                  );

                  // Wait a bit for the server to start up
                  await new Promise((resolve) => setTimeout(resolve, 2000));

                  // Retry the original request that failed
                  if (error.config) {
                    console.log("Retrying original request");
                    // Clear previous error to avoid infinite loop
                    error.config.headers = {
                      ...error.config.headers,
                      "X-Retry-After-Restart": "true",
                    };
                    return axios(error.config);
                  }
                }
              } catch (restartErr) {
                console.error("Failed to restart server:", restartErr);
                isReconnecting = false;
              }
            }
          }

          // On Windows, add specific messaging about Windows Defender or Firewall
          if (window.navigator.userAgent.includes("Windows")) {
            console.error(
              "Windows detected: If this persists, check Windows Defender Firewall settings to allow the app to communicate on localhost:5000"
            );

            // You could display this message to the user in the UI
          }
        }
        return Promise.reject(error);
      }
    );
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
      if (error.response) {
        console.error(
          `API Error: ${error.response.status} ${error.response.statusText}`,
          error.response.data
        );
      } else if (error.request) {
        console.error("API Request Error: No response received", error.request);
      } else {
        console.error("API Error:", error.message);
      }
      return Promise.reject(error);
    }
  );
};

export default configureApi;
