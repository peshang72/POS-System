import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUsers } from "../../hooks/useUsers";
import UserForm from "./UserForm";
import UserList from "./UserList";

const Staff = () => {
  const { t } = useTranslation();
  const {
    users,
    isLoading,
    error,
    pagination,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,
    resetPassword,
  } = useUsers();

  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Handle edit user
  const handleEdit = (user) => {
    setCurrentUser(user);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle delete user
  const handleDelete = (userId) => {
    setUserToDelete(userId);
    setIsConfirmDeleteOpen(true);
  };

  // Handle reset password
  const handleResetPassword = (userId) => {
    setUserToResetPassword(userId);
    setNewPassword("");
    setIsResetPasswordOpen(true);
  };

  // Confirm delete user
  const confirmDelete = async () => {
    try {
      await deleteUser(userToDelete);
      setIsConfirmDeleteOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // Confirm reset password
  const confirmResetPassword = async () => {
    try {
      await resetPassword(userToResetPassword, newPassword);
      setIsResetPasswordOpen(false);
      setUserToResetPassword(null);
      setNewPassword("");
    } catch (error) {
      console.error("Error resetting password:", error);
    }
  };

  // Handle form submission
  const handleSubmit = async (userData) => {
    try {
      if (currentUser) {
        await updateUser(currentUser._id, userData);
      } else {
        await addUser(userData);
      }
      setShowForm(false);
      setCurrentUser(null);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // Cancel form
  const cancelForm = () => {
    setShowForm(false);
    setCurrentUser(null);
  };

  // Handle search and filters
  const handleSearch = () => {
    const params = {
      page: currentPage,
      search: searchTerm,
      ...(roleFilter && { role: roleFilter }),
      ...(activeFilter !== "" && { active: activeFilter === "true" }),
    };
    fetchUsers(params);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchUsers({
      page,
      search: searchTerm,
      ...(roleFilter && { role: roleFilter }),
      ...(activeFilter !== "" && { active: activeFilter === "true" }),
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("navigation.staff")}</h1>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-md border border-[#363636] bg-[#262626] hover:bg-[#363636] text-white flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            {t("staff.addUser")}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card bg-[#1e1e1e] p-6 rounded-md shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {currentUser ? t("staff.editUser") : t("staff.addUser")}
          </h2>
          <UserForm
            onSubmit={handleSubmit}
            initialData={currentUser || {}}
            onCancel={cancelForm}
          />
        </div>
      )}

      {!showForm && (
        <div className="card bg-[#1e1e1e] p-4 rounded-md shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={t("staff.searchPlaceholder")}
                className="w-full p-2 border border-[#363636] bg-[#262626] rounded-md text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="md:w-1/4">
              <select
                className="w-full p-2 border border-[#363636] bg-[#262626] rounded-md text-white"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">{t("staff.allRoles")}</option>
                <option value="admin">{t("staff.admin")}</option>
                <option value="manager">{t("staff.manager")}</option>
                <option value="cashier">{t("staff.cashier")}</option>
              </select>
            </div>
            <div className="md:w-1/4">
              <select
                className="w-full p-2 border border-[#363636] bg-[#262626] rounded-md text-white"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                <option value="">{t("staff.allStatus")}</option>
                <option value="true">{t("staff.active")}</option>
                <option value="false">{t("staff.inactive")}</option>
              </select>
            </div>
            <div>
              <button
                onClick={handleSearch}
                className="w-full md:w-auto px-4 py-2 rounded-md border border-[#363636] bg-[#262626] hover:bg-[#363636] text-white"
              >
                {t("common.search")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card bg-[#1e1e1e] rounded-md shadow-md">
        <UserList
          users={users}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onResetPassword={handleResetPassword}
          isLoading={isLoading}
          error={error}
        />

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center p-4">
            <nav className="flex space-x-1">
              {[...Array(pagination.pages).keys()].map((page) => (
                <button
                  key={page + 1}
                  onClick={() => handlePageChange(page + 1)}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === page + 1
                      ? "bg-[#363636] text-white"
                      : "bg-[#262626] text-gray-300 hover:bg-[#2e2e2e]"
                  }`}
                >
                  {page + 1}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] p-6 rounded-md shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {t("staff.confirmDelete")}
            </h3>
            <p className="mb-6 text-gray-300">{t("staff.deleteWarning")}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="px-4 py-2 rounded-md border border-[#363636] bg-[#262626] hover:bg-[#363636] text-white"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md border border-transparent bg-red-600 hover:bg-red-700 text-white"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Dialog */}
      {isResetPasswordOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] p-6 rounded-md shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {t("staff.resetPassword")}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {t("staff.newPassword")}
              </label>
              <input
                type="password"
                className="w-full p-2 border border-[#363636] bg-[#262626] rounded-md text-white"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsResetPasswordOpen(false)}
                className="px-4 py-2 rounded-md border border-[#363636] bg-[#262626] hover:bg-[#363636] text-white"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={confirmResetPassword}
                disabled={newPassword.length < 6}
                className={`px-4 py-2 rounded-md border border-transparent text-white ${
                  newPassword.length < 6
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
              >
                {t("common.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
