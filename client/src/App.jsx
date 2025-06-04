import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "./hooks/useAuth";
import { Toaster } from "react-hot-toast";
import UpdateNotification from "./components/ui/UpdateNotification";

// Layouts
import AuthLayout from "./components/layouts/AuthLayout";
import DashboardLayout from "./components/layouts/DashboardLayout";

// Pages
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import POS from "./pages/pos/POS";
import Products from "./pages/inventory/Products";
import AddProduct from "./pages/inventory/AddProduct";
import EditProduct from "./pages/inventory/EditProduct";
import AddCategory from "./pages/inventory/AddCategory";
import Customers from "./pages/customers/Customers";
import Staff from "./pages/staff/Staff";
import Reports from "./pages/reports/Reports";
import Settings from "./pages/settings/Settings";
import GeneralSettings from "./pages/settings/GeneralSettings";
import LoyaltySettings from "./pages/settings/LoyaltySettings";
import TransactionDetail from "./pages/transactions/TransactionDetail";
import NotFound from "./pages/NotFound";

function App() {
  const { isAuthenticated, user } = useAuth();
  const { i18n } = useTranslation();

  // Set language direction based on user preference
  useEffect(() => {
    if (user?.languagePreference) {
      i18n.changeLanguage(user.languagePreference);

      // Add RTL class for Kurdish language
      if (user.languagePreference === "ku") {
        document.documentElement.classList.add("rtl");
      } else {
        document.documentElement.classList.remove("rtl");
      }
    }
  }, [user, i18n]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
          },
        }}
      />
      <UpdateNotification />
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
          />
        </Route>

        {/* Protected Routes */}
        <Route element={<DashboardLayout />}>
          <Route
            path="/"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/pos"
            element={isAuthenticated ? <POS /> : <Navigate to="/login" />}
          />
          {/* Inventory Routes */}
          <Route
            path="/inventory/products"
            element={isAuthenticated ? <Products /> : <Navigate to="/login" />}
          />
          <Route
            path="/inventory/products/add"
            element={
              isAuthenticated ? <AddProduct /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/inventory/products/edit/:id"
            element={
              isAuthenticated ? <EditProduct /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/inventory/categories/add"
            element={
              isAuthenticated ? <AddCategory /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/inventory"
            element={
              isAuthenticated ? (
                <Navigate to="/inventory/products" />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/customers"
            element={isAuthenticated ? <Customers /> : <Navigate to="/login" />}
          />
          <Route
            path="/staff"
            element={isAuthenticated ? <Staff /> : <Navigate to="/login" />}
          />
          <Route
            path="/reports"
            element={isAuthenticated ? <Reports /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={isAuthenticated ? <Settings /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings/general"
            element={
              isAuthenticated ? <GeneralSettings /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/settings/loyalty"
            element={
              isAuthenticated ? <LoyaltySettings /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/transactions/:id"
            element={
              isAuthenticated ? <TransactionDetail /> : <Navigate to="/login" />
            }
          />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
