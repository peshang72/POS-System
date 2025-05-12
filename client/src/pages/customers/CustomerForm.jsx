import { useState } from "react";
import { useTranslation } from "react-i18next";

const CustomerForm = ({ onSubmit, initialData = {}, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || "",
    lastName: initialData.lastName || "",
    phone: initialData.phone || "",
    email: initialData.email || "",
    street: initialData.address?.street || "",
    city: initialData.address?.city || "",
    state: initialData.address?.state || "",
    zipCode: initialData.address?.zipCode || "",
    country: initialData.address?.country || "Iraq",
    languagePreference: initialData.languagePreference || "en",
    ...initialData,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t("validation.required");
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t("validation.required");
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t("validation.required");
    } else if (!/^(\+\d{1,3}[- ]?)?\d{10,14}$/.test(formData.phone)) {
      newErrors.phone = t("validation.invalidPhone");
    }

    if (
      formData.email &&
      !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)
    ) {
      newErrors.email = t("validation.invalidEmail");
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
      // Format data for API
      const customerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email || undefined,
        address: {
          street: formData.street || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          zipCode: formData.zipCode || undefined,
          country: formData.country,
        },
        languagePreference: formData.languagePreference,
      };

      await onSubmit(customerData);

      // Reset form after successful submission
      if (!initialData._id) {
        setFormData({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "Iraq",
          languagePreference: "en",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      if (error.response?.data?.error) {
        // Handle server validation errors
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

  return (
    <div className="w-full overflow-hidden bg-gradient-to-br from-[#121212] to-[#1E1E1E] border border-[#262626] rounded-lg shadow-lg">
      <div className="relative p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.form && (
            <div className="bg-[#F23557]/10 border border-[#F23557]/20 text-[#F23557] px-4 py-3 rounded-md">
              {errors.form}
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-xl font-bold font-['Rajdhani',sans-serif] text-white flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[#7E3FF2]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              {t("customers.personalInfo") || "Personal Information"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("customers.firstName")}{" "}
                  <span className="text-[#F23557]">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full h-10 rounded-md border ${
                    errors.firstName ? "border-[#F23557]" : "border-[#363636]"
                  } bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]`}
                />
                {errors.firstName && (
                  <p className="text-[#F23557] text-xs mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("customers.lastName")}{" "}
                  <span className="text-[#F23557]">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full h-10 rounded-md border ${
                    errors.lastName ? "border-[#F23557]" : "border-[#363636]"
                  } bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]`}
                />
                {errors.lastName && (
                  <p className="text-[#F23557] text-xs mt-1">
                    {errors.lastName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("customers.phone")}{" "}
                  <span className="text-[#F23557]">*</span>
                </label>
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full h-10 rounded-md border ${
                      errors.phone ? "border-[#F23557]" : "border-[#363636]"
                    } bg-[#262626] text-white pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-[#F23557] text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("customers.email")}
                </label>
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full h-10 rounded-md border ${
                      errors.email ? "border-[#F23557]" : "border-[#363636]"
                    } bg-[#262626] text-white pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[#F23557] text-xs mt-1">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-[#363636] pt-4"></div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold font-['Rajdhani',sans-serif] text-white flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[#36F2A3]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              {t("customers.address")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="street"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("customers.street")}
                </label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-[#363636] bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("customers.city")}
                </label>
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full h-10 rounded-md border border-[#363636] bg-[#262626] text-white pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("customers.state")}
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-[#363636] bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="zipCode"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("customers.zipCode")}
                </label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-[#363636] bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("customers.country")}
                </label>
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full h-10 rounded-md border border-[#363636] bg-[#262626] text-white pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="languagePreference"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("customers.language")}
                </label>
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 5h7"></path>
                    <path d="M9 18h11"></path>
                    <path d="m5 11 4 7"></path>
                    <path d="m5 11-3 7"></path>
                    <path d="M15 7V5l2 2-2 2V7Z"></path>
                    <path d="M15 7h-3"></path>
                  </svg>
                  <select
                    id="languagePreference"
                    name="languagePreference"
                    value={formData.languagePreference}
                    onChange={handleChange}
                    className="w-full h-10 rounded-md border border-[#363636] bg-[#262626] text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
                  >
                    <option value="en">{t("language.english")}</option>
                    <option value="ku">{t("language.kurdish")}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-[#363636] rounded-md shadow-sm text-sm font-medium text-white bg-[#262626] hover:bg-[#363636] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#121212] focus:ring-[#7E3FF2]"
              >
                {t("common.cancel")}
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="relative overflow-hidden px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#7E3FF2] to-[#3D9CF2] hover:from-[#8F50FF] hover:to-[#4EADFF] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#121212] focus:ring-[#7E3FF2] disabled:opacity-70"
            >
              <span className="relative z-10">
                {isSubmitting ? t("common.submitting") : t("common.submit")}
              </span>
              <span className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.1)_100%)] opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
