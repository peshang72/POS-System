import { useAuth } from "./useAuth";

// Default role permissions - same as in UserPermissions.jsx
const rolePermissions = {
  admin: {
    dashboard: ["view"],
    pos: ["use", "refund", "discount"],
    products: ["view", "create", "edit", "delete"],
    categories: ["view", "create", "edit", "delete"],
    customers: ["view", "create", "edit", "delete"],
    staff: ["view", "create", "edit", "delete"],
    reports: ["view", "export"],
    transactions: ["view", "refund"],
    settings: ["view", "edit"],
  },
  manager: {
    dashboard: ["view"],
    pos: ["use", "refund", "discount"],
    products: ["view", "create", "edit", "delete"],
    categories: ["view", "create", "edit"],
    customers: ["view", "create", "edit"],
    staff: ["view"],
    reports: ["view", "export"],
    transactions: ["view", "refund"],
    settings: ["view"],
  },
  cashier: {
    dashboard: ["view"],
    pos: ["use"],
    products: ["view"],
    categories: ["view"],
    customers: ["view", "create", "edit"],
    staff: [],
    reports: [],
    transactions: ["view"],
    settings: [],
  },
};

export const usePermissions = () => {
  const { user } = useAuth();

  const getUserPermissions = () => {
    if (!user) return {};

    // If user has custom permissions, use those; otherwise fall back to role permissions
    return user.permissions || rolePermissions[user.role] || {};
  };

  const hasPermission = (module, action) => {
    if (!user) return false;

    // Admins always have access
    if (user.role === "admin") return true;

    const userPermissions = getUserPermissions();
    const modulePermissions = userPermissions[module] || [];

    return modulePermissions.includes(action);
  };

  const hasAnyPermission = (module, actions = []) => {
    if (!user) return false;

    // Admins always have access
    if (user.role === "admin") return true;

    return actions.some((action) => hasPermission(module, action));
  };

  const hasAllPermissions = (module, actions = []) => {
    if (!user) return false;

    // Admins always have access
    if (user.role === "admin") return true;

    return actions.every((action) => hasPermission(module, action));
  };

  const canAccessPage = (page) => {
    if (!user) return false;

    // Admins can access everything
    if (user.role === "admin") return true;

    // Map pages to required permissions
    const pagePermissions = {
      dashboard: { module: "dashboard", action: "view" },
      pos: { module: "pos", action: "use" },
      products: { module: "products", action: "view" },
      "products/add": { module: "products", action: "create" },
      "products/edit": { module: "products", action: "edit" },
      categories: { module: "categories", action: "view" },
      "categories/add": { module: "categories", action: "create" },
      customers: { module: "customers", action: "view" },
      staff: { module: "staff", action: "view" },
      reports: { module: "reports", action: "view" },
      transactions: { module: "transactions", action: "view" },
      settings: { module: "settings", action: "view" },
      "settings/users": { module: "staff", action: "edit" }, // Only admins can manage permissions
    };

    const permission = pagePermissions[page];
    if (!permission) return true; // If no specific permission required, allow access

    return hasPermission(permission.module, permission.action);
  };

  return {
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessPage,
    getUserPermissions,
  };
};
