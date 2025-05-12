import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./styles/index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { I18nextProvider } from "react-i18next";
import i18n from "./utils/i18n";
import configureApi from "./utils/apiConfig";

// Configure API before rendering the app
configureApi();

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </I18nextProvider>
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
