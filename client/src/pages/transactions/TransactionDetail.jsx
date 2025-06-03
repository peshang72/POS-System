import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Receipt,
  User,
  Calendar,
  DollarSign,
  CreditCard,
  Package,
  Edit3,
  Trash2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Sparkles,
  ShoppingCart,
} from "lucide-react";

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const isAdmin = user?.role === "admin";
  const canEdit = isAdmin;
  const canDelete = isAdmin;

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/transactions/${id}`);
      if (response.data.success) {
        setTransaction(response.data.data);
        setEditData(response.data.data);
      } else {
        setError("Failed to fetch transaction");
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
      setError(error.response?.data?.message || "Failed to fetch transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      const response = await axios.put(`/api/transactions/${id}`, editData);
      if (response.data.success) {
        setTransaction(response.data.data);
        setIsEditing(false);
        toast.success(t("transactions.updateSuccess"));
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error(
        error.response?.data?.message || t("transactions.updateError")
      );
    }
  };

  const handleDelete = async () => {
    try {
      const response = await axios.delete(`/api/transactions/${id}`);
      if (response.data.success) {
        toast.success(t("transactions.deleteSuccess"));
        navigate("/");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error(
        error.response?.data?.message || t("transactions.deleteError")
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
      case "failed":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "cash":
        return <DollarSign size={20} />;
      case "card":
        return <CreditCard size={20} />;
      default:
        return <CreditCard size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse flex flex-col items-center">
              <RefreshCw size={32} className="animate-spin text-primary mb-2" />
              <p className="text-gray-400">{t("transactions.loading")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <p className="text-red-500 text-lg">{error}</p>
              <button
                onClick={() => navigate("/")}
                className="mt-4 btn btn-primary"
              >
                {t("transactions.backToReports")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Receipt size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {t("transactions.notFound")}
              </p>
            </div>
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Link
                to="/"
                className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 mr-4"
              >
                <ArrowLeft
                  className="text-gray-600 dark:text-gray-400"
                  size={20}
                />
              </Link>
              <div className="p-3 bg-gradient-to-r from-primary to-secondary rounded-xl shadow-lg mr-4">
                <Receipt className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t("transactions.transactionDetails")}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {t("transactions.invoiceNumber")} #{transaction.invoiceNumber}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {(canEdit || canDelete) && (
              <div className="flex space-x-3">
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
                      isEditing
                        ? "bg-gray-500 hover:bg-gray-600 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    <Edit3 size={18} className="mr-2" />
                    {isEditing
                      ? t("transactions.cancel")
                      : t("transactions.edit")}
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300"
                  >
                    <Trash2 size={18} className="mr-2" />
                    {t("transactions.delete")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Transaction Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                <CheckCircle
                  className="text-blue-600 dark:text-blue-400"
                  size={20}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("transactions.status")}
              </h3>
            </div>
            <div
              className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                transaction.paymentStatus
              )}`}
            >
              {transaction.paymentStatus.charAt(0).toUpperCase() +
                transaction.paymentStatus.slice(1)}
            </div>
          </div>

          {/* Total Amount Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                <DollarSign
                  className="text-green-600 dark:text-green-400"
                  size={20}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("transactions.totalAmount")}
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${transaction.total.toFixed(2)}
            </p>
          </div>

          {/* Payment Method Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                {getPaymentMethodIcon(transaction.paymentMethod)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("transactions.paymentMethod")}
              </h3>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white capitalize">
              {transaction.paymentMethod}
            </p>
          </div>

          {/* Date Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mr-3">
                <Calendar
                  className="text-orange-600 dark:text-orange-400"
                  size={20}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("transactions.date")}
              </h3>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {new Date(transaction.transactionDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Transaction Details */}
          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/20 rounded-lg mr-3">
                    <ShoppingCart className="text-primary" size={20} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t("transactions.itemsPurchased")}
                  </h3>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {transaction.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-primary/10 rounded-lg mr-4">
                          <Package className="text-primary" size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {typeof item.productSnapshot?.name === "string"
                              ? item.productSnapshot.name
                              : item.productSnapshot?.name?.en ||
                                item.productSnapshot?.name?.ku ||
                                "Unknown Product"}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            SKU: {item.productSnapshot?.sku || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.quantity} × ${item.unitPrice.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ${item.subtotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Transaction Summary */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>{t("transactions.subtotal")}:</span>
                      <span>${transaction.subtotal.toFixed(2)}</span>
                    </div>
                    {transaction.taxAmount > 0 && (
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>
                          {t("transactions.tax")} ({transaction.taxRate}%):
                        </span>
                        <span>${transaction.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {transaction.discountAmount > 0 && (
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>{t("transactions.discount")}:</span>
                        <span>-${transaction.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span>{t("transactions.total")}:</span>
                      <span>${transaction.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Information */}
          <div className="space-y-6">
            {/* Customer Information */}
            {transaction.customer && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
                    <User
                      className="text-indigo-600 dark:text-indigo-400"
                      size={20}
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t("transactions.customer")}
                  </h3>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transaction.customer.firstName}{" "}
                    {transaction.customer.lastName}
                  </p>
                  {transaction.customer.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {transaction.customer.phone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Cashier Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg mr-3">
                  <User
                    className="text-teal-600 dark:text-teal-400"
                    size={20}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("transactions.cashier")}
                </h3>
              </div>
              <p className="font-medium text-gray-900 dark:text-white">
                {transaction.cashier?.firstName && transaction.cashier?.lastName
                  ? `${transaction.cashier.firstName} ${transaction.cashier.lastName}`
                  : transaction.cashier?.username || "Unknown"}
              </p>
            </div>

            {/* Additional Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-3">
                  <Clock
                    className="text-gray-600 dark:text-gray-400"
                    size={20}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("transactions.additionalInfo")}
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t("transactions.register")}:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {transaction.register}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t("transactions.currency")}:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {transaction.currency}
                  </span>
                </div>
                {transaction.refunded && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("transactions.refunded")}:
                    </span>
                    <span className="text-red-600 dark:text-red-400">Yes</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
                  <AlertCircle
                    className="text-red-600 dark:text-red-400"
                    size={20}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("transactions.confirmDelete")}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t("transactions.deleteWarning")}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {t("transactions.cancel")}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  {t("transactions.delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionDetail;
