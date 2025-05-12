import { useTranslation } from "react-i18next";
import { format } from "date-fns";

const UserList = ({
  users,
  onEdit,
  onDelete,
  onResetPassword,
  isLoading,
  error,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-300">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>{t("staff.noUsersFound")}</p>
      </div>
    );
  }

  // Function to get role badge color
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-900 text-red-200";
      case "manager":
        return "bg-blue-900 text-blue-200";
      case "cashier":
        return "bg-green-900 text-green-200";
      default:
        return "bg-gray-900 text-gray-200";
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#333333]">
        <thead className="bg-[#222222]">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
            >
              {t("staff.name")}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
            >
              {t("staff.contact")}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
            >
              {t("staff.role")}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
            >
              {t("staff.status")}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
            >
              {t("staff.lastLogin")}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider"
            >
              {t("common.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="bg-[#1e1e1e] divide-y divide-[#333333]">
          {users.map((user) => (
            <tr key={user._id} className="hover:bg-[#292929]">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-400">{user.username}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-white">{user.email}</div>
                <div className="text-sm text-gray-400">{user.phone}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(
                    user.role
                  )}`}
                >
                  {t(`staff.${user.role}`)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.active
                      ? "bg-green-900 text-green-200"
                      : "bg-red-900 text-red-200"
                  }`}
                >
                  {user.active ? t("staff.active") : t("staff.inactive")}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {user.lastLogin
                  ? format(new Date(user.lastLogin), "PPp")
                  : t("staff.never")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(user)}
                  className="text-blue-400 hover:text-blue-300 mr-3"
                >
                  {t("common.edit")}
                </button>
                <button
                  onClick={() => onResetPassword(user._id)}
                  className="text-yellow-400 hover:text-yellow-300 mr-3"
                >
                  {t("staff.resetPwd")}
                </button>
                <button
                  onClick={() => onDelete(user._id)}
                  className="text-red-400 hover:text-red-300"
                >
                  {t("common.delete")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
