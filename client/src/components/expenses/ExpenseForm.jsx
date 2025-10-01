import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, DollarSign, FileText, User, Building, Tag } from "lucide-react";

const ExpenseForm = ({ onSubmit, initialData = {}, onCancel }) => {
  const { t } = useTranslation();
  
  console.log("ExpenseForm rendering with initialData:", initialData);

  const [formData, setFormData] = useState(() => {
    try {
      return {
        title: initialData?.title || "",
        description: initialData?.description || "",
        category: initialData?.category || "",
        amount: initialData?.amount || "",
        currency: initialData?.currency || "USD",
        exchangeRate: initialData?.exchangeRate || 1410,
        paymentMethod: initialData?.paymentMethod || "cash",
        paymentDetails: {
          bankName: initialData?.paymentDetails?.bankName || "",
          accountNumber: initialData?.paymentDetails?.accountNumber || "",
          checkNumber: initialData?.paymentDetails?.checkNumber || "",
          cardLast4: initialData?.paymentDetails?.cardLast4 || "",
          reference: initialData?.paymentDetails?.reference || "",
        },
        vendor: {
          name: initialData?.vendor?.name || "",
          contact: {
            phone: initialData?.vendor?.contact?.phone || "",
            email: initialData?.vendor?.contact?.email || "",
            address: initialData?.vendor?.contact?.address || "",
          },
        },
        receipt: initialData?.receipt || "",
        expenseDate: initialData?.expenseDate || new Date().toISOString().split("T")[0],
        department: initialData?.department || "",
        tags: initialData?.tags || [],
        recurring: {
          isRecurring: initialData?.recurring?.isRecurring || false,
          frequency: initialData?.recurring?.frequency || "monthly",
          nextDueDate: initialData?.recurring?.nextDueDate || "",
          endDate: initialData?.recurring?.endDate || "",
        },
        notes: initialData?.notes || "",
      };
    } catch (error) {
      console.error("Error initializing form data:", error);
      return {
        title: "",
        description: "",
        category: "",
        amount: "",
        currency: "USD",
        exchangeRate: 1410,
        paymentMethod: "cash",
        paymentDetails: {
          bankName: "",
          accountNumber: "",
          checkNumber: "",
          cardLast4: "",
          reference: "",
        },
        vendor: {
          name: "",
          contact: {
            phone: "",
            email: "",
            address: "",
          },
        },
        receipt: "",
        expenseDate: new Date().toISOString().split("T")[0],
        department: "",
        tags: [],
        recurring: {
          isRecurring: false,
          frequency: "monthly",
          nextDueDate: "",
          endDate: "",
        },
        notes: "",
      };
    }
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState("");

  const expenseCategories = [
    { value: "utilities", label: "Utilities" },
    { value: "rent", label: "Rent" },
    { value: "supplies", label: "Supplies" },
    { value: "equipment", label: "Equipment" },
    { value: "maintenance", label: "Maintenance" },
    { value: "marketing", label: "Marketing" },
    { value: "transportation", label: "Transportation" },
    { value: "office", label: "Office" },
    { value: "professional_services", label: "Professional Services" },
    { value: "insurance", label: "Insurance" },
    { value: "taxes", label: "Taxes" },
    { value: "other", label: "Other" },
  ];

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "transfer", label: "Bank Transfer" },
    { value: "check", label: "Check" },
    { value: "other", label: "Other" },
  ];

  const frequencies = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
  ];

  const handleChange = (e) => {
    try {
      const { name, value, type, checked } = e.target;
      console.log("handleChange called with:", { name, value, type, checked });

      if (name.includes(".")) {
        const [parent, child] = name.split(".");
        if (parent === "paymentDetails" || parent === "vendor" || parent === "recurring") {
          setFormData(prev => ({
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: type === "checkbox" ? checked : value,
            },
          }));
        } else if (parent === "vendor" && child === "contact") {
          // This won't be triggered by regular input, handled separately
        }
      } else {
        setFormData(prev => {
          console.log("Updating formData for field:", name, "with value:", value);
          return {
            ...prev,
            [name]: type === "checkbox" ? checked : value,
          };
        });
      }

      // Clear error when field is changed
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: "",
        }));
      }
    } catch (error) {
      console.error("Error in handleChange:", error);
    }
  };

  const handleNestedChange = (parent, child, value) => {
    try {
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } catch (error) {
      console.error("Error in handleNestedChange:", error);
    }
  };

  const addTag = () => {
    try {
      if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag.trim()],
        }));
        setNewTag("");
      }
    } catch (error) {
      console.error("Error in addTag:", error);
    }
  };

  const removeTag = (tagToRemove) => {
    try {
      setFormData(prev => ({
        ...prev,
        tags: prev.tags.filter((tag) => tag !== tagToRemove),
      }));
    } catch (error) {
      console.error("Error in removeTag:", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t("validation.required");
    }

    if (!formData.category) {
      newErrors.category = t("validation.required");
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = t("validation.required");
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = t("validation.required");
    }

    if (!formData.expenseDate) {
      newErrors.expenseDate = t("validation.required");
    }

    if (formData.recurring.isRecurring && !formData.recurring.frequency) {
      newErrors["recurring.frequency"] = t("validation.required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate amount in base currency
      const amountInBaseCurrency = formData.currency === "IQD" 
        ? formData.amount / formData.exchangeRate 
        : formData.amount;

      // Format data for API
      const expenseData = {
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        amount: Number(formData.amount),
        currency: formData.currency,
        exchangeRate: Number(formData.exchangeRate),
        amountInBaseCurrency,
        paymentMethod: formData.paymentMethod,
        paymentDetails: formData.paymentDetails,
        vendor: formData.vendor.name ? formData.vendor : undefined,
        receipt: formData.receipt || undefined,
        expenseDate: new Date(formData.expenseDate),
        department: formData.department || undefined,
        tags: formData.tags,
        recurring: formData.recurring.isRecurring ? formData.recurring : undefined,
        notes: formData.notes || undefined,
      };

      await onSubmit(expenseData);

      // Reset form after successful submission
      if (!initialData || !initialData._id) {
        setFormData({
          title: "",
          description: "",
          category: "",
          amount: "",
          currency: "USD",
          exchangeRate: 1410,
          paymentMethod: "cash",
          paymentDetails: {
            bankName: "",
            accountNumber: "",
            checkNumber: "",
            cardLast4: "",
            reference: "",
          },
          vendor: {
            name: "",
            contact: {
              phone: "",
              email: "",
              address: "",
            },
          },
          receipt: "",
          expenseDate: new Date().toISOString().split("T")[0],
          department: "",
          tags: [],
          recurring: {
            isRecurring: false,
            frequency: "monthly",
            nextDueDate: "",
            endDate: "",
          },
          notes: "",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      if (error.response?.data?.error) {
        setErrors({
          ...errors,
          form: error.response.data.error,
        });
      } else {
        setErrors({
          ...errors,
          form: t("errors.generalError"),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  try {
    return (
      <div className="w-full overflow-hidden bg-gradient-to-br from-[#121212] to-[#1E1E1E] border border-[#262626] rounded-lg shadow-lg">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText size={20} />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter expense title"
                />
                {errors.title && (
                  <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {expenseCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-400 text-sm mt-1">{errors.category}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter expense description"
              />
            </div>
          </div>

          {/* Amount and Currency */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <DollarSign size={20} />
              Amount & Currency
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="text-red-400 text-sm mt-1">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="IQD">IQD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Exchange Rate
                </label>
                <input
                  type="number"
                  name="exchangeRate"
                  value={formData.exchangeRate}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="text-sm text-gray-400">
              Amount in Base Currency: {formData.amount ? (
                formData.currency === "IQD" 
                  ? (Number(formData.amount) / Number(formData.exchangeRate)).toFixed(2)
                  : Number(formData.amount).toFixed(2)
              ) : "0.00"} USD
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building size={20} />
              Payment Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method *
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
                {errors.paymentMethod && (
                  <p className="text-red-400 text-sm mt-1">{errors.paymentMethod}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expense Date *
                </label>
                <input
                  type="date"
                  name="expenseDate"
                  value={formData.expenseDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.expenseDate && (
                  <p className="text-red-400 text-sm mt-1">{errors.expenseDate}</p>
                )}
              </div>
            </div>

            {/* Payment Details based on method */}
            {formData.paymentMethod === "card" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Card Last 4 Digits
                </label>
                <input
                  type="text"
                  name="paymentDetails.cardLast4"
                  value={formData.paymentDetails.cardLast4}
                  onChange={handleChange}
                  maxLength="4"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1234"
                />
              </div>
            )}

            {formData.paymentMethod === "transfer" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="paymentDetails.bankName"
                    value={formData.paymentDetails.bankName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Bank name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="paymentDetails.accountNumber"
                    value={formData.paymentDetails.accountNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Account number"
                  />
                </div>
              </div>
            )}

            {formData.paymentMethod === "check" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Check Number
                </label>
                <input
                  type="text"
                  name="paymentDetails.checkNumber"
                  value={formData.paymentDetails.checkNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Check number"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reference/Notes
              </label>
              <input
                type="text"
                name="paymentDetails.reference"
                value={formData.paymentDetails.reference}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Payment reference or notes"
              />
            </div>
          </div>

          {/* Vendor Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User size={20} />
              Vendor Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vendor Name
              </label>
              <input
                type="text"
                name="vendor.name"
                value={formData.vendor.name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Vendor name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.vendor.contact.phone}
                  onChange={(e) => handleNestedChange("vendor", "contact", { ...formData.vendor.contact, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.vendor.contact.email}
                  onChange={(e) => handleNestedChange("vendor", "contact", { ...formData.vendor.contact, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.vendor.contact.address}
                  onChange={(e) => handleNestedChange("vendor", "contact", { ...formData.vendor.contact, address: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Address"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Tag size={20} />
              Additional Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Department"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Receipt URL
                </label>
                <input
                  type="url"
                  name="receipt"
                  value={formData.receipt}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/receipt"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-200 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Recurring Expense */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="recurring.isRecurring"
                  checked={formData.recurring.isRecurring}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-300">
                  This is a recurring expense
                </label>
              </div>

              {formData.recurring.isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Frequency *
                    </label>
                    <select
                      name="recurring.frequency"
                      value={formData.recurring.frequency}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {frequencies.map((freq) => (
                        <option key={freq.value} value={freq.value}>
                          {freq.label}
                        </option>
                      ))}
                    </select>
                    {errors["recurring.frequency"] && (
                      <p className="text-red-400 text-sm mt-1">{errors["recurring.frequency"]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Next Due Date
                    </label>
                    <input
                      type="date"
                      name="recurring.nextDueDate"
                      value={formData.recurring.nextDueDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="recurring.endDate"
                      value={formData.recurring.endDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes"
              />
            </div>
          </div>

          {/* Error Display */}
          {errors.form && (
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-500 text-red-400">
              <p>{errors.form}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-[#333]">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : (initialData && initialData._id) ? "Update Expense" : "Create Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  } catch (error) {
    console.error("Error rendering ExpenseForm:", error);
    return (
      <div className="w-full overflow-hidden bg-gradient-to-br from-[#121212] to-[#1E1E1E] border border-[#262626] rounded-lg shadow-lg">
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-400 mb-4">Error Loading Form</h2>
            <p className="text-gray-300 mb-4">There was an error loading the expense form.</p>
            <p className="text-gray-400 text-sm mb-4">Error: {error.message}</p>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default ExpenseForm;
