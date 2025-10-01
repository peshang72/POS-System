import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  DollarSign,
  Calendar,
  User,
  Building,
  Tag,
  Eye,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";

const ExpenseList = ({
  expenses,
  isLoading,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onApproveExpense,
  onRejectExpense,
  onMarkAsPaid,
  onViewExpense,
  pagination,
  onPageChange,
  onFilterChange,
  filters,
}) => {
  const { t } = useTranslation();
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-900/20 text-yellow-400 border-yellow-500";
      case "approved":
        return "bg-blue-900/20 text-blue-400 border-blue-500";
      case "rejected":
        return "bg-red-900/20 text-red-400 border-red-500";
      case "paid":
        return "bg-green-900/20 text-green-400 border-green-500";
      default:
        return "bg-gray-900/20 text-gray-400 border-gray-500";
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      utilities: "bg-blue-600",
      rent: "bg-purple-600",
      supplies: "bg-green-600",
      equipment: "bg-orange-600",
      maintenance: "bg-red-600",
      marketing: "bg-pink-600",
      transportation: "bg-indigo-600",
      office: "bg-teal-600",
      professional_services: "bg-cyan-600",
      insurance: "bg-yellow-600",
      taxes: "bg-gray-600",
      other: "bg-slate-600",
    };
    return colors[category] || "bg-gray-600";
  };

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const handleSelectExpense = (expenseId) => {
    setSelectedExpenses((prev) =>
      prev.includes(expenseId)
        ? prev.filter((id) => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedExpenses.length === (expenses || []).length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses((expenses || []).map((expense) => expense._id));
    }
  };

  const handleBulkAction = (action) => {
    // Implement bulk actions
    console.log("Bulk action:", action, selectedExpenses);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-[#1a1a1a] rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="h-8 bg-gray-700 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Expenses</h2>
          <p className="text-gray-400">
            Manage and track your business expenses
          </p>
        </div>
        <button
          onClick={onAddExpense}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-[#1a1a1a] rounded-lg p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search expenses..."
              value={filters.search || ""}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-[#121212] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline flex items-center gap-2"
          >
            <Filter size={18} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[#333]">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={filters.category || ""}
                onChange={(e) => onFilterChange({ category: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="utilities">Utilities</option>
                <option value="rent">Rent</option>
                <option value="supplies">Supplies</option>
                <option value="equipment">Equipment</option>
                <option value="maintenance">Maintenance</option>
                <option value="marketing">Marketing</option>
                <option value="transportation">Transportation</option>
                <option value="office">Office</option>
                <option value="professional_services">Professional Services</option>
                <option value="insurance">Insurance</option>
                <option value="taxes">Taxes</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.status || ""}
                onChange={(e) => onFilterChange({ status: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => onFilterChange({ startDate: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => onFilterChange({ endDate: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedExpenses.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-400">
              {selectedExpenses.length} expense(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction("approve")}
                className="btn btn-sm btn-outline text-green-400 border-green-500 hover:bg-green-900/20"
              >
                Approve
              </button>
              <button
                onClick={() => handleBulkAction("reject")}
                className="btn btn-sm btn-outline text-red-400 border-red-500 hover:bg-red-900/20"
              >
                Reject
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="btn btn-sm btn-outline text-red-400 border-red-500 hover:bg-red-900/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="space-y-4">
        {(expenses || []).length === 0 ? (
          <div className="text-center py-12">
            <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No expenses found</h3>
            <p className="text-gray-400 mb-4">
              {filters.search || filters.category || filters.status
                ? "Try adjusting your filters"
                : "Get started by adding your first expense"}
            </p>
            {!filters.search && !filters.category && !filters.status && (
              <button onClick={onAddExpense} className="btn btn-primary">
                Add Expense
              </button>
            )}
          </div>
        ) : (
          (expenses || []).map((expense) => (
            <div
              key={expense._id}
              className="bg-[#1a1a1a] rounded-lg p-6 hover:bg-[#1f1f1f] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedExpenses.includes(expense._id)}
                    onChange={() => handleSelectExpense(expense._id)}
                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {expense.title}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {expense.expenseNumber} • {expense.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">
                          {formatCurrency(expense.amount, expense.currency)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatCurrency(expense.amountInBaseCurrency, "USD")} USD
                        </div>
                      </div>
                    </div>

                    {expense.description && (
                      <p className="text-gray-300 text-sm">{expense.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        {format(new Date(expense.expenseDate), "MMM dd, yyyy")}
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={16} />
                        {expense.createdBy?.firstName} {expense.createdBy?.lastName}
                      </div>
                      {expense.vendor?.name && (
                        <div className="flex items-center gap-1">
                          <Building size={16} />
                          {expense.vendor.name}
                        </div>
                      )}
                      {expense.department && (
                        <div className="flex items-center gap-1">
                          <Tag size={16} />
                          {expense.department}
                        </div>
                      )}
                    </div>

                    {expense.tags && expense.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {expense.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      expense.status
                    )}`}
                  >
                    {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewExpense(expense)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-md transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    
                    {expense.status === "pending" && (
                      <>
                        <button
                          onClick={() => onApproveExpense(expense._id)}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-md transition-colors"
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => onRejectExpense(expense._id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors"
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                    
                    {expense.status === "approved" && (
                      <button
                        onClick={() => onMarkAsPaid(expense._id)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-md transition-colors"
                        title="Mark as Paid"
                      >
                        <DollarSign size={16} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => onEditExpense(expense)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    
                    <button
                      onClick={() => onDeleteExpense(expense._id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {((pagination.current - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.current * pagination.limit, pagination.total)} of{" "}
            {pagination.total} expenses
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.current - 1)}
              disabled={pagination.current === 1}
              className="px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#333]"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => onPageChange(i + 1)}
                  className={`px-3 py-2 rounded-md text-sm ${
                    pagination.current === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-[#1a1a1a] text-gray-400 hover:bg-[#333]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => onPageChange(pagination.current + 1)}
              disabled={pagination.current === pagination.pages}
              className="px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#333]"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
