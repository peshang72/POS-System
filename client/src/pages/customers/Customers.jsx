import { useState } from "react";
import { useTranslation } from "react-i18next";
import CustomerForm from "./CustomerForm";
import CustomerList from "./CustomerList";
import { useCustomers } from "../../hooks/useCustomers";

const Customers = () => {
  const { t } = useTranslation();
  const {
    customers,
    isLoading,
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomers();

  const [showForm, setShowForm] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Handle edit customer
  const handleEdit = (customer) => {
    setCurrentCustomer(customer);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle delete customer
  const handleDelete = (customerId) => {
    setCustomerToDelete(customerId);
    setIsConfirmDeleteOpen(true);
  };

  // Confirm delete customer
  const confirmDelete = async () => {
    try {
      await deleteCustomer(customerToDelete);
      setIsConfirmDeleteOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  // Handle form submission
  const handleSubmit = async (customerData) => {
    try {
      if (currentCustomer) {
        await updateCustomer(currentCustomer._id, customerData);
      } else {
        await addCustomer(customerData);
      }
      setShowForm(false);
      setCurrentCustomer(null);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // Cancel form
  const cancelForm = () => {
    setShowForm(false);
    setCurrentCustomer(null);
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer) => {
    const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
    const phone = customer.phone.toLowerCase();
    const email = customer.email?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();

    return (
      fullName.includes(term) || phone.includes(term) || email.includes(term)
    );
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("customers.customers")}</h1>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-md bg-gradient-to-r from-[#7E3FF2] to-[#3D9CF2] hover:from-[#8F50FF] hover:to-[#4EADFF] text-white flex items-center gap-2"
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            {t("customers.addCustomer")}
          </button>
        )}
      </div>

      {showForm && (
        <div className="p-6 rounded-lg bg-secondary-bg border border-[#262626] shadow-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {currentCustomer
              ? t("customers.editCustomer")
              : t("customers.addCustomer")}
          </h2>
          <CustomerForm
            onSubmit={handleSubmit}
            initialData={currentCustomer || {}}
            onCancel={cancelForm}
          />
        </div>
      )}

      {!showForm && (
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder={t("customers.searchPlaceholder")}
              className="w-full h-10 rounded-md border border-[#363636] bg-[#262626] text-white px-10 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
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
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="card border border-[#262626] overflow-hidden rounded-lg">
        <CustomerList
          customers={filteredCustomers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {/* Confirmation Dialog */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#363636] shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-white">
              {t("customers.confirmDelete")}
            </h3>
            <p className="mb-6 text-gray-300">{t("customers.deleteWarning")}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="px-4 py-2 border border-[#363636] rounded-md shadow-sm text-sm font-medium text-white bg-[#262626] hover:bg-[#363636]"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F23557] hover:bg-[#E02447]"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
