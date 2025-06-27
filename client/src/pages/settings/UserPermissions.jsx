import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { useUsers } from "../../hooks/useUsers";
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  Search,
  Filter,
  Settings,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Check as CheckIcon,
  Crown,
  User,
  ShoppingCart,
  Package,
  Folder,
  FileText,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";

const UserPermissions = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { users, isLoading, fetchUsers, updateUser } = useUsers();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] =
    useState(null);
  const [isBulkPermissionModalOpen, setIsBulkPermissionModalOpen] =
    useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [pendingChanges, setPendingChanges] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Permission definitions
  const permissions = {
    dashboard: {
      name: "Dashboard",
      description: "View dashboard and analytics",
      icon: Settings,
      actions: ["view"],
    },
    pos: {
      name: "POS System",
      description: "Use point of sale system",
      icon: ShoppingCart,
      actions: ["use", "refund", "discount"],
    },
    products: {
      name: "Products",
      description: "Manage inventory and products",
      icon: Package,
      actions: ["view", "create", "edit", "delete"],
    },
    categories: {
      name: "Categories",
      description: "Manage product categories",
      icon: Folder,
      actions: ["view", "create", "edit", "delete"],
    },
    customers: {
      name: "Customers",
      description: "Manage customer information",
      icon: Users,
      actions: ["view", "create", "edit", "delete"],
    },
    staff: {
      name: "Staff Management",
      description: "Manage staff and users",
      icon: UserCheck,
      actions: ["view", "create", "edit", "delete"],
    },
    reports: {
      name: "Reports",
      description: "View and generate reports",
      icon: FileText,
      actions: ["view", "export"],
    },
    transactions: {
      name: "Transactions",
      description: "View transaction history",
      icon: CreditCard,
      actions: ["view", "refund"],
    },
    settings: {
      name: "Settings",
      description: "Configure system settings",
      icon: Settings,
      actions: ["view", "edit"],
    },
  };

  // Default role permissions
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

  useEffect(() => {
    if (currentUser?.role !== "admin") {
      toast.error("Access denied. Admin privileges required.");
      return;
    }
    fetchUsers();
  }, [currentUser, fetchUsers]);

  // Filter users
  const filteredUsers = users.filter((user) => {
    if (user.role === "admin") return false; // Don't show admins

    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "" || user.role === roleFilter;
    const matchesActive =
      activeFilter === "" || user.active.toString() === activeFilter;

    return matchesSearch && matchesRole && matchesActive;
  });

  const handleUserSelect = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((user) => user._id));
    }
  };

  const handlePermissionChange = (userId, module, action, hasPermission) => {
    const userKey = userId;

    setPendingChanges((prev) => {
      const user = users.find((u) => u._id === userId);
      const userChanges = prev[userKey] || {};

      // Get the current permissions for this module (either from pending changes or user's current permissions)
      const currentUserPermissions =
        user?.permissions?.[module] ||
        rolePermissions[user?.role]?.[module] ||
        [];
      const moduleChanges =
        userChanges[module] !== undefined
          ? userChanges[module]
          : currentUserPermissions;

      let newModuleChanges;
      if (hasPermission) {
        // Add the action if it's not already there
        newModuleChanges = moduleChanges.includes(action)
          ? moduleChanges
          : [...moduleChanges, action];
      } else {
        // Remove the action
        newModuleChanges = moduleChanges.filter((a) => a !== action);
      }

      return {
        ...prev,
        [userKey]: {
          ...userChanges,
          [module]: newModuleChanges,
        },
      };
    });

    setHasUnsavedChanges(true);
  };

  const savePermissionChanges = async () => {
    try {
      const updatedUserIds = Object.keys(pendingChanges);

      for (const [userId, changedModules] of Object.entries(pendingChanges)) {
        const user = users.find((u) => u._id === userId);

        // Start with the user's current permissions or role-based permissions
        const currentPermissions =
          user?.permissions || rolePermissions[user?.role] || {};

        // Merge the changed modules with existing permissions
        const updatedPermissions = {
          ...currentPermissions,
          ...changedModules,
        };

        await updateUser(userId, { permissions: updatedPermissions });
      }

      toast.success("Permissions updated successfully");

      // Check if the current user's permissions were updated
      if (updatedUserIds.includes(currentUser._id)) {
        toast.success(
          "Your permissions have been updated. Please refresh the page to see the changes.",
          { duration: 5000 }
        );
      }

      setPendingChanges({});
      setHasUnsavedChanges(false);
      fetchUsers(); // Refresh the user data
    } catch (error) {
      toast.error("Failed to update permissions");
    }
  };

  const discardChanges = () => {
    setPendingChanges({});
    setHasUnsavedChanges(false);
  };

  const applyRolePermissions = async (userIds, role) => {
    try {
      const permissions = rolePermissions[role];

      for (const userId of userIds) {
        await updateUser(userId, { permissions });
      }

      toast.success(`Applied ${role} permissions to ${userIds.length} user(s)`);
      setIsBulkPermissionModalOpen(false);
      setSelectedUsers([]);
    } catch (error) {
      toast.error("Failed to apply role permissions");
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return Crown;
      case "manager":
        return Shield;
      case "cashier":
        return User;
      default:
        return User;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "manager":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "cashier":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You need administrator privileges to access user permissions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl shadow-lg mr-4">
              <Shield className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                User Permissions
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage role-based access control for your team
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search users by name, username, or email..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <select
                className="px-4 py-3 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
              </select>

              <select
                className="px-4 py-3 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Save Changes Bar */}
          {hasUnsavedChanges && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className="text-amber-600 dark:text-amber-400"
                    size={20}
                  />
                  <span className="text-amber-700 dark:text-amber-300 font-medium">
                    You have unsaved permission changes
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={discardChanges}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={savePermissionChanges}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                  >
                    <CheckIcon size={16} />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
              <div className="flex items-center justify-between">
                <span className="text-indigo-700 dark:text-indigo-300 font-medium">
                  {selectedUsers.length} user(s) selected
                </span>
                <button
                  onClick={() => setIsBulkPermissionModalOpen(true)}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <Settings size={16} />
                  Apply Role Permissions
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Team Members ({filteredUsers.length})
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    selectedUsers.length === filteredUsers.length &&
                    filteredUsers.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Select All
                </span>
              </label>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Loading users...
                </p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500 dark:text-gray-400">
                  No users found
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                const isExpanded = expandedUser === user._id;

                return (
                  <div key={user._id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => handleUserSelect(user._id)}
                          className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                        />

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.firstName.charAt(0)}
                            {user.lastName.charAt(0)}
                          </div>

                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              @{user.username} • {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`px-3 py-1 rounded-full border text-xs font-medium ${getRoleColor(
                            user.role
                          )}`}
                        >
                          <RoleIcon className="inline w-3 h-3 mr-1" />
                          {user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)}
                        </div>

                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.active
                              ? "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30"
                              : "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30"
                          }`}
                        >
                          {user.active ? "Active" : "Inactive"}
                        </div>

                        <button
                          onClick={() =>
                            setExpandedUser(isExpanded ? null : user._id)
                          }
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                        >
                          {isExpanded ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Permissions View */}
                    {isExpanded && (
                      <div className="mt-6 pl-8">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                          Permissions Overview
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(permissions).map(
                            ([module, config]) => {
                              // Get current permissions from user or pending changes
                              const currentPermissions =
                                user.permissions?.[module] ||
                                rolePermissions[user.role]?.[module] ||
                                [];
                              const pendingUserChanges =
                                pendingChanges[user._id] || {};
                              const userPermissions =
                                pendingUserChanges[module] !== undefined
                                  ? pendingUserChanges[module]
                                  : currentPermissions;
                              const IconComponent = config.icon;

                              return (
                                <div
                                  key={module}
                                  className="p-6 border border-gray-200 dark:border-gray-600 rounded-lg"
                                >
                                  <div className="flex items-center gap-3 mb-4">
                                    <IconComponent
                                      size={20}
                                      className="text-indigo-500"
                                    />
                                    <span className="font-semibold text-gray-900 dark:text-white text-base">
                                      {config.name}
                                    </span>
                                  </div>
                                  <div className="space-y-3">
                                    {config.actions.map((action) => {
                                      const hasPermission =
                                        userPermissions.includes(action);
                                      const isChanged =
                                        pendingUserChanges[module] !==
                                          undefined &&
                                        currentPermissions.includes(action) !==
                                          hasPermission;

                                      return (
                                        <label
                                          key={action}
                                          className="flex items-center gap-3 cursor-pointer group"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={hasPermission}
                                            onChange={(e) =>
                                              handlePermissionChange(
                                                user._id,
                                                module,
                                                action,
                                                e.target.checked
                                              )
                                            }
                                            className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                                          />
                                          <span
                                            className={`text-sm capitalize font-medium ${
                                              isChanged
                                                ? "text-amber-600 dark:text-amber-400"
                                                : "text-gray-700 dark:text-gray-300"
                                            } group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors`}
                                          >
                                            {action}
                                            {isChanged && (
                                              <span className="ml-1 text-xs">
                                                *
                                              </span>
                                            )}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bulk Permission Modal */}
        {isBulkPermissionModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Apply Role Permissions
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Apply default permissions for the selected role to{" "}
                {selectedUsers.length} user(s).
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a role...</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsBulkPermissionModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    applyRolePermissions(selectedUsers, selectedRole)
                  }
                  disabled={!selectedRole}
                  className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white rounded-lg transition-colors duration-200"
                >
                  Apply Permissions
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPermissions;
