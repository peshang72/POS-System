import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const UserForm = ({ onSubmit, initialData, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "cashier",
    active: true,
    languagePreference: "en",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      // When editing, don't include the password field
      const { password, ...rest } = initialData;
      setFormData(rest);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = t("validation.required");
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = t("validation.required");
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t("validation.required");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("validation.required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("validation.invalidEmail");
    }

    // Password is required only for new users
    if (!initialData._id && !formData.password) {
      newErrors.password = t("validation.required");
    } else if (!initialData._id && formData.password.length < 6) {
      newErrors.password = t("validation.passwordLength");
    }

    if (
      formData.phone &&
      !/^(\+\d{1,3}[- ]?)?\d{10,14}$/.test(formData.phone)
    ) {
      newErrors.phone = t("validation.invalidPhone");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // If editing and password is empty, don't include it in the submission
      if (initialData._id && !formData.password) {
        const { password, ...dataToSubmit } = formData;
        onSubmit(dataToSubmit);
      } else {
        onSubmit(formData);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t("staff.username")} *
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md bg-[#262626] text-white ${
              errors.username ? "border-red-500" : "border-[#363636]"
            }`}
          />
          {errors.username && (
            <p className="text-red-500 text-xs mt-1">{errors.username}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t("staff.role")} *
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 border border-[#363636] bg-[#262626] rounded-md text-white"
          >
            <option value="admin">{t("staff.admin")}</option>
            <option value="manager">{t("staff.manager")}</option>
            <option value="cashier">{t("staff.cashier")}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t("staff.firstName")} *
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md bg-[#262626] text-white ${
              errors.firstName ? "border-red-500" : "border-[#363636]"
            }`}
          />
          {errors.firstName && (
            <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t("staff.lastName")} *
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md bg-[#262626] text-white ${
              errors.lastName ? "border-red-500" : "border-[#363636]"
            }`}
          />
          {errors.lastName && (
            <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t("staff.email")} *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md bg-[#262626] text-white ${
              errors.email ? "border-red-500" : "border-[#363636]"
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t("staff.phone")}
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone || ""}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md bg-[#262626] text-white ${
              errors.phone ? "border-red-500" : "border-[#363636]"
            }`}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {initialData._id ? t("staff.newPassword") : t("staff.password")}
            {!initialData._id && " *"}
          </label>
          <input
            type="password"
            name="password"
            value={formData.password || ""}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md bg-[#262626] text-white ${
              errors.password ? "border-red-500" : "border-[#363636]"
            }`}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
          {initialData._id && (
            <p className="text-gray-400 text-xs mt-1">
              {t("staff.leaveBlankPassword")}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t("staff.language")}
          </label>
          <select
            name="languagePreference"
            value={formData.languagePreference}
            onChange={handleChange}
            className="w-full p-2 border border-[#363636] bg-[#262626] rounded-md text-white"
          >
            <option value="en">{t("languages.english")}</option>
            <option value="ku">{t("languages.kurdish")}</option>
          </select>
        </div>

        <div className="flex items-center mt-4">
          <input
            type="checkbox"
            name="active"
            id="active"
            checked={formData.active}
            onChange={handleChange}
            className="h-4 w-4 rounded border-[#363636] bg-[#262626] text-blue-600"
          />
          <label htmlFor="active" className="ml-2 text-sm text-gray-300">
            {t("staff.activeAccount")}
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md border border-[#363636] bg-[#262626] hover:bg-[#363636] text-white"
        >
          {t("common.cancel")}
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-md border border-transparent bg-[#262626] hover:bg-[#363636] text-white"
        >
          {initialData._id ? t("common.update") : t("common.create")}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
