import { useTranslation } from "react-i18next";

const CostHistoryTable = ({ costHistory = [] }) => {
  const { t } = useTranslation();

  if (!costHistory || costHistory.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic py-4">
        {t("products.noCostHistory") || "No cost history available"}
      </div>
    );
  }

  // Sort by date, newest first
  const sortedHistory = [...costHistory].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#363636]">
        <thead className="bg-[#262626]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
              {t("products.date") || "Date"}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
              {t("products.quantity") || "Quantity"}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
              {t("products.cost") || "Cost"}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
              {t("products.total") || "Total"}
            </th>
          </tr>
        </thead>
        <tbody className="bg-[#1A1A1A] divide-y divide-[#363636]">
          {sortedHistory.map((entry, index) => (
            <tr key={index} className="hover:bg-[#222222]">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                {new Date(entry.date).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                {entry.quantity}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                ${entry.cost.toFixed(2)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                ${(entry.cost * entry.quantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CostHistoryTable;
