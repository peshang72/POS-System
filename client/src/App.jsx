import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "./hooks/useAuth";
import { usePermissions } from "./hooks/usePermissions";
import { Toaster } from "react-hot-toast";
import UpdateNotification from "./components/ui/UpdateNotification";
import PermissionGuard from "./components/PermissionGuard";

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
import UserPermissions from "./pages/settings/UserPermissions";
import Transactions from "./pages/transactions/Transactions";
import TransactionDetail from "./pages/transactions/TransactionDetail";
import Expenses from "./pages/expenses/Expenses";
import NotFound from "./pages/NotFound";

// Protected Route Component
const ProtectedRoute = ({ children, page, requiredModule, requiredAction }) => {
  const { isAuthenticated } = useAuth();
  const { canAccessPage, hasPermission } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check page-level permissions
  if (page && !canAccessPage(page)) {
    return (
      <PermissionGuard page={page} showFallback>
        {children}
      </PermissionGuard>
    );
  }

  // Check specific module/action permissions
  if (
    requiredModule &&
    requiredAction &&
    !hasPermission(requiredModule, requiredAction)
  ) {
    return (
      <PermissionGuard
        module={requiredModule}
        action={requiredAction}
        showFallback
      >
        {children}
      </PermissionGuard>
    );
  }

  return children;
};

function App() {
  const { isAuthenticated, user } = useAuth();
  const { canAccessPage } = usePermissions();
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
            element={
              <ProtectedRoute page="dashboard">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute page="pos">
                <POS />
              </ProtectedRoute>
            }
          />
          {/* Inventory Routes */}
          <Route
            path="/inventory/products"
            element={
              <ProtectedRoute page="products">
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/products/add"
            element={
              <ProtectedRoute page="products/add">
                <AddProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/products/edit/:id"
            element={
              <ProtectedRoute page="products/edit">
                <EditProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/categories/add"
            element={
              <ProtectedRoute page="categories/add">
                <AddCategory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute page="products">
                <Navigate to="/inventory/products" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute page="customers">
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute page="staff">
                <Staff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute page="reports">
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute page="expenses">
                <Expenses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute page="transactions">
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute page="settings">
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/general"
            element={
              <ProtectedRoute page="settings">
                <GeneralSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/loyalty"
            element={
              <ProtectedRoute page="settings">
                <LoyaltySettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/users"
            element={
              <ProtectedRoute requiredModule="staff" requiredAction="edit">
                <UserPermissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions/:id"
            element={
              <ProtectedRoute page="transactions">
                <TransactionDetail />
              </ProtectedRoute>
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
