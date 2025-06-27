import { usePermissions } from "../hooks/usePermissions";
import { AlertTriangle } from "lucide-react";

const PermissionGuard = ({
  module,
  action,
  actions = [],
  requireAll = false,
  page,
  fallback = null,
  showFallback = false,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccessPage } =
    usePermissions();

  let hasAccess = false;

  if (page) {
    hasAccess = canAccessPage(page);
  } else if (actions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(module, actions)
      : hasAnyPermission(module, actions);
  } else if (module && action) {
    hasAccess = hasPermission(module, action);
  } else {
    // If no specific permissions provided, allow access
    hasAccess = true;
  }

  if (!hasAccess) {
    if (showFallback) {
      return (
        fallback || (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
            <AlertTriangle className="mx-auto text-red-500 mb-3" size={32} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Access Restricted
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access this feature.
            </p>
          </div>
        )
      );
    }
    return null;
  }

  return children;
};

export default PermissionGuard;
