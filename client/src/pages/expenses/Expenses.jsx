import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useExpenses } from "../../hooks/useExpenses";
import ExpenseList from "../../components/expenses/ExpenseList";
import ExpenseForm from "../../components/expenses/ExpenseForm";
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const Expenses = () => {
  const { t } = useTranslation();
  const {
    expenses,
    isLoading,
    error,
    pagination,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    approveExpense,
    rejectExpense,
    markAsPaid,
    getExpenseSummary,
  } = useExpenses();

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingExpense, setViewingExpense] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
    startDate: "",
    endDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [summary, setSummary] = useState(null);

  // Load expenses on component mount and when filters change
  useEffect(() => {
    loadExpenses();
  }, [currentPage, filters]);

  // Load summary data
  useEffect(() => {
    loadSummary();
  }, [filters.startDate, filters.endDate]);

  const loadExpenses = async () => {
    try {
      await fetchExpenses({
        page: currentPage,
        limit: 20,
        ...filters,
      });
    } catch (error) {
      console.error("Error loading expenses:", error);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryData = await getExpenseSummary(filters.startDate, filters.endDate);
      setSummary(summaryData);
    } catch (error) {
      console.error("Error loading summary:", error);
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowForm(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleViewExpense = (expense) => {
    setViewingExpense(expense);
    // You can implement a view modal here
    console.log("View expense:", expense);
  };

  const handleFormSubmit = async (expenseData) => {
    try {
      if (editingExpense) {
        await updateExpense(editingExpense._id, expenseData);
        toast.success("Expense updated successfully");
      } else {
        await addExpense(expenseData);
        toast.success("Expense created successfully");
      }
      setShowForm(false);
      setEditingExpense(null);
      loadExpenses();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error(error.message || "Failed to save expense");
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await deleteExpense(expenseId);
        toast.success("Expense deleted successfully");
        loadExpenses();
      } catch (error) {
        console.error("Error deleting expense:", error);
        toast.error(error.message || "Failed to delete expense");
      }
    }
  };

  const handleApproveExpense = async (expenseId) => {
    try {
      await approveExpense(expenseId);
      toast.success("Expense approved successfully");
      loadExpenses();
    } catch (error) {
      console.error("Error approving expense:", error);
      toast.error(error.message || "Failed to approve expense");
    }
  };

  const handleRejectExpense = async (expenseId) => {
    const reason = window.prompt("Please provide a reason for rejection:");
    if (reason) {
      try {
        await rejectExpense(expenseId, reason);
        toast.success("Expense rejected successfully");
        loadExpenses();
      } catch (error) {
        console.error("Error rejecting expense:", error);
        toast.error(error.message || "Failed to reject expense");
      }
    }
  };

  const handleMarkAsPaid = async (expenseId) => {
    try {
      await markAsPaid(expenseId);
      toast.success("Expense marked as paid successfully");
      loadExpenses();
    } catch (error) {
      console.error("Error marking expense as paid:", error);
      toast.error(error.message || "Failed to mark expense as paid");
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      status: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
  };

  // Calculate summary stats
  const totalExpenses = (expenses || []).reduce((sum, expense) => sum + (expense.amountInBaseCurrency || 0), 0);
  const pendingCount = (expenses || []).filter(expense => expense.status === "pending").length;
  const approvedCount = (expenses || []).filter(expense => expense.status === "approved").length;
  const paidCount = (expenses || []).filter(expense => expense.status === "paid").length;

  if (showForm) {
    try {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              {editingExpense ? "Edit Expense" : "Add New Expense"}
            </h1>
            <button
              onClick={handleFormCancel}
              className="btn btn-outline"
            >
              Back to Expenses
            </button>
          </div>
        <ExpenseForm
          onSubmit={handleFormSubmit}
          initialData={editingExpense}
          onCancel={handleFormCancel}
        />
        </div>
      );
    } catch (error) {
      console.error("Error rendering expense form:", error);
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Add New Expense</h1>
            <button
              onClick={handleFormCancel}
              className="btn btn-outline"
            >
              Back to Expenses
            </button>
          </div>
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-400 mb-4">Error Loading Form</h2>
            <p className="text-red-300 mb-4">There was an error loading the expense form.</p>
            <p className="text-gray-400 text-sm">Error: {error.message}</p>
            <button
              onClick={handleFormCancel}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Expense Management</h1>
          <p className="text-gray-400">
            Track and manage your business expenses
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-white">
                ${totalExpenses.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-white">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Approved</p>
              <p className="text-2xl font-bold text-white">{approvedCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Paid</p>
              <p className="text-2xl font-bold text-white">{paidCount}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-red-900/20 border border-red-500 text-red-400">
          <p>{error}</p>
        </div>
      )}

      {/* Expenses List */}
      <ExpenseList
        expenses={expenses}
        isLoading={isLoading}
        onAddExpense={handleAddExpense}
        onEditExpense={handleEditExpense}
        onDeleteExpense={handleDeleteExpense}
        onApproveExpense={handleApproveExpense}
        onRejectExpense={handleRejectExpense}
        onMarkAsPaid={handleMarkAsPaid}
        onViewExpense={handleViewExpense}
        pagination={pagination}
        onPageChange={handlePageChange}
        onFilterChange={handleFilterChange}
        filters={filters}
      />

      {/* Clear Filters Button */}
      {(filters.search || filters.category || filters.status || filters.startDate || filters.endDate) && (
        <div className="flex justify-center">
          <button
            onClick={clearFilters}
            className="btn btn-outline"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Expenses;
