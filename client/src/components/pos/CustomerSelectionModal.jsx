import { useState } from "react";
import { X, UserCircle, Search, Plus, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";

const CustomerSelectionModal = ({
  isOpen,
  onClose,
  customers,
  isLoading,
  onSelectCustomer,
  onAddNewCustomer,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  // Filter customers based on search query
  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (customer.firstName?.toLowerCase() || "").includes(searchLower) ||
      (customer.lastName?.toLowerCase() || "").includes(searchLower) ||
      (customer.email?.toLowerCase() || "").includes(searchLower) ||
      (customer.phone?.toLowerCase() || "").includes(searchLower)
    );
  });

  // Helper function to get customer full name
  const getCustomerName = (customer) => {
    if (customer.fullName) return customer.fullName;
    if (customer.firstName && customer.lastName)
      return `${customer.firstName} ${customer.lastName}`;
    if (customer.firstName) return customer.firstName;
    if (customer.lastName) return customer.lastName;
    return t("pos.unknownCustomer", "Unknown Customer");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-[500px] max-w-[90vw] max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserCircle className="text-accent" size={20} />
            <span>{t("pos.selectCustomer", "Select Customer")}</span>
          </h2>
          <button
            className="p-1 hover:bg-gray-800 rounded-full"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <input
              type="text"
              className="input w-full bg-gray-800 pl-10"
              placeholder={t("pos.searchCustomers", "Search customers...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          <button
            className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg mb-4 flex items-center justify-between"
            onClick={() => onSelectCustomer(null)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                <UserCircle size={24} className="text-gray-300" />
              </div>
              <div>
                <div className="font-medium">
                  {t("pos.guestCustomer", "Guest Customer")}
                </div>
                <div className="text-sm text-gray-400">
                  {t(
                    "pos.continueAsGuest",
                    "Continue without selecting a customer"
                  )}
                </div>
              </div>
            </div>
            <div>
              <span className="px-3 py-1 bg-accent bg-opacity-20 text-accent text-xs rounded-full">
                {t("pos.guest", "Guest")}
              </span>
            </div>
          </button>

          {isLoading ? (
            <div className="text-center py-8">
              <span className="loading loading-spinner"></span>
              <p className="mt-2 text-gray-400">
                {t("common.loading", "Loading customers...")}
              </p>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="space-y-3">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer._id}
                  className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-between"
                  onClick={() => onSelectCustomer(customer)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent bg-opacity-20 flex items-center justify-center">
                      <UserCircle size={24} className="text-accent" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-white">
                        {getCustomerName(customer)}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-accent text-sm mt-1">
                          <Phone size={14} />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {!customer.phone && customer.email && (
                        <div className="text-sm text-gray-400">
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </div>
                  {customer.purchaseCount > 0 && (
                    <div className="flex flex-col items-end">
                      <span className="px-2 py-1 bg-accent bg-opacity-20 text-accent text-xs rounded-full mb-1">
                        {customer.purchaseCount} {t("pos.orders", "Orders")}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">
                {t("pos.noCustomersFound", "No customers found")}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            className="btn btn-accent w-full flex items-center justify-center gap-2"
            onClick={onAddNewCustomer}
          >
            <Plus size={18} />
            <span>{t("pos.addNewCustomer", "Add New Customer")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerSelectionModal;
