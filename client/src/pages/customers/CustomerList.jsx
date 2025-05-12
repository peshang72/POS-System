import { useTranslation } from "react-i18next";

const CustomerList = ({ customers, onEdit, onDelete, isLoading, error }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="text-center py-10 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7E3FF2] mx-auto mb-4"></div>
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#F23557]/10 border border-[#F23557]/20 text-[#F23557] px-4 py-3 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p>{t("customers.noCustomers")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#363636]">
        <thead className="bg-[#262626]">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider"
            >
              {t("customers.name")}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider"
            >
              {t("customers.phone")}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider"
            >
              {t("customers.email")}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider"
            >
              {t("customers.loyaltyPoints")}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider"
            >
              {t("customers.totalSpent")}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider"
            >
              {t("customers.memberSince")}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-zinc-300 uppercase tracking-wider"
            >
              {t("common.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="bg-[#1A1A1A] divide-y divide-[#363636]">
          {customers.map((customer) => (
            <tr key={customer._id} className="hover:bg-[#222222]">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-white">
                  {customer.firstName} {customer.lastName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-zinc-400">{customer.phone}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-zinc-400">
                  {customer.email || "-"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-[#7E3FF2] font-medium">
                  {customer.loyaltyPoints || 0}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-[#36F2A3] font-medium">
                  $
                  {customer.totalSpent
                    ? customer.totalSpent.toFixed(2)
                    : "0.00"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-zinc-400">
                  {new Date(customer.memberSince).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(customer)}
                  className="text-[#3D9CF2] hover:text-[#7E3FF2] mr-4"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 inline"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(customer._id)}
                  className="text-[#F23557] hover:text-[#F25764]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 inline"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerList;
