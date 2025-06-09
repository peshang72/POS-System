import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTransactions } from "../../hooks/useTransactions";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  DollarSign,
  User,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const Transactions = () => {
  const { t } = useTranslation();
  const { transactions, loading, error, refreshTransactions } =
    useTransactions();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter transactions based on search term and status
  const filteredTransactions = transactions.filter((transaction) => {
    const customerName = transaction.customer
      ? `${transaction.customer.firstName || ""} ${
          transaction.customer.lastName || ""
        }`.trim()
      : "";

    const matchesSearch =
      (transaction.id?.toString() || "").includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.amount?.toString() || "").includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || transaction.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-success bg-opacity-20 text-success";
      case "Pending":
        return "bg-warning bg-opacity-20 text-warning";
      case "Cancelled":
        return "bg-error bg-opacity-20 text-error";
      default:
        return "bg-gray-500 bg-opacity-20 text-gray-400";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart size={24} className="text-accent" />
            {t("navigation.transactions") || "Transactions"}
          </h1>
          <p className="text-gray-400">
            {t("transactions.subtitle") || "View and manage all transactions"}
          </p>
        </div>

        <button
          onClick={refreshTransactions}
          className="btn btn-outline flex items-center gap-2 transition-transform hover:scale-105"
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          <span>{t("dashboard.refresh") || "Refresh"}</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card border border-gray-800">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder={
                  t("transactions.search") || "Search transactions..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input pl-10 pr-8 appearance-none bg-secondary-bg"
              >
                <option value="all">
                  {t("transactions.allStatus") || "All Status"}
                </option>
                <option value="Completed">
                  {t("transactions.completed") || "Completed"}
                </option>
                <option value="Pending">
                  {t("transactions.pending") || "Pending"}
                </option>
                <option value="Cancelled">
                  {t("transactions.cancelled") || "Cancelled"}
                </option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            {t("transactions.showing") || "Showing"}{" "}
            {filteredTransactions.length}{" "}
            {t("transactions.results") || "results"}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-error bg-opacity-20 border border-error text-error">
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-pulse flex flex-col items-center">
            <RefreshCw size={32} className="animate-spin text-accent mb-2" />
            <p className="text-gray-400">
              {t("dashboard.loading") || "Loading..."}
            </p>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      {!loading && (
        <div className="card border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 bg-opacity-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    {t("transactions.id") || "Transaction ID"}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    {t("transactions.customer") || "Customer"}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    {t("transactions.amount") || "Amount"}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    {t("transactions.status") || "Status"}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    {t("transactions.date") || "Date"}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    {t("transactions.actions") || "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      {searchTerm || statusFilter !== "all"
                        ? t("transactions.noResults") ||
                          "No transactions match your search criteria"
                        : t("transactions.noTransactions") ||
                          "No transactions found"}
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <tr
                      key={transaction.id || Math.random()}
                      className="hover:bg-gray-800 hover:bg-opacity-30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-accent bg-opacity-20 flex items-center justify-center">
                            <ShoppingCart size={14} className="text-accent" />
                          </div>
                          <span className="font-medium">
                            #{transaction.id || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <span>
                            {transaction.customer
                              ? `${transaction.customer.firstName || ""} ${
                                  transaction.customer.lastName || ""
                                }`.trim() || "Walk-in Customer"
                              : "Walk-in Customer"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-success" />
                          <span className="font-medium">
                            ${transaction.amount || "0.00"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock size={16} />
                          <span className="text-sm">
                            {transaction.date
                              ? formatDate(transaction.date)
                              : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/transactions/${transaction.id || "unknown"}`}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent bg-opacity-20 text-accent hover:bg-opacity-30 transition-colors text-sm"
                        >
                          <Eye size={14} />
                          {t("transactions.view") || "View"}
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {t("transactions.page") || "Page"} {currentPage}{" "}
                {t("transactions.of") || "of"} {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Transactions;
