import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCategories } from "../../hooks/useCategories";

const CategoryForm = ({ onSubmit, initialData = {}, onCancel }) => {
  const { t } = useTranslation();
  const { categories } = useCategories();

  const [formData, setFormData] = useState({
    name: {
      en: initialData.name?.en || "",
      ku: initialData.name?.ku || "",
    },
    parent: initialData.parent || "",
    image: initialData.image || "",
    active: initialData.active !== undefined ? initialData.active : true,
    ...initialData,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }

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

    if (!formData.name.en.trim()) {
      newErrors["name.en"] = t("validation.required");
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
      const categoryData = {
        name: {
          en: formData.name.en,
          ku: formData.name.ku || undefined,
        },
        parent: formData.parent || null,
        image: formData.image || undefined,
        active: formData.active,
      };

      await onSubmit(categoryData);

      // Reset form after successful submission
      if (!initialData._id) {
        setFormData({
          name: { en: "", ku: "" },
          parent: "",
          image: "",
          active: true,
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

  const resetForm = () => {
    setFormData({
      name: { en: "", ku: "" },
      parent: "",
      image: "",
      active: true,
    });
    setErrors({});
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
                className="h-5 w-5 text-[#F2B705]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
              {t("categories.details") || "Category Details"}
            </h2>
            <p className="text-sm text-zinc-400">
              {t("categories.detailsDescription") ||
                "Enter category information below"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Name in English */}
            <div className="space-y-2">
              <label
                htmlFor="name.en"
                className="block text-sm font-medium text-zinc-300"
              >
                {t("categories.nameEn") || "Name (English)"}{" "}
                <span className="text-[#F23557]">*</span>
              </label>
              <input
                type="text"
                id="name.en"
                name="name.en"
                value={formData.name.en}
                onChange={handleChange}
                className={`w-full h-10 rounded-md border ${
                  errors["name.en"] ? "border-[#F23557]" : "border-[#363636]"
                } bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]`}
              />
              {errors["name.en"] && (
                <p className="text-[#F23557] text-xs mt-1">
                  {errors["name.en"]}
                </p>
              )}
            </div>

            {/* Category Name in Kurdish */}
            <div className="space-y-2">
              <label
                htmlFor="name.ku"
                className="block text-sm font-medium text-zinc-300"
              >
                {t("categories.nameKu") || "Name (Kurdish)"}
              </label>
              <input
                type="text"
                id="name.ku"
                name="name.ku"
                value={formData.name.ku}
                onChange={handleChange}
                className="w-full h-10 rounded-md border border-[#363636] bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
              />
            </div>

            {/* Parent Category */}
            <div className="space-y-2">
              <label
                htmlFor="parent"
                className="block text-sm font-medium text-zinc-300"
              >
                {t("categories.parent") || "Parent Category"}
              </label>
              <select
                id="parent"
                name="parent"
                value={formData.parent}
                onChange={handleChange}
                className="w-full h-10 rounded-md border border-[#363636] bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
              >
                <option value="">
                  {t("categories.noParent") || "No Parent (Root Category)"}
                </option>
                {categories
                  .filter(
                    (category) =>
                      !initialData._id || category._id !== initialData._id
                  )
                  .map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name.en}
                    </option>
                  ))}
              </select>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <label
                htmlFor="image"
                className="block text-sm font-medium text-zinc-300"
              >
                {t("categories.image") || "Image URL"}
              </label>
              <input
                type="text"
                id="image"
                name="image"
                placeholder="https://example.com/image.jpg"
                value={formData.image}
                onChange={handleChange}
                className="w-full h-10 rounded-md border border-[#363636] bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
              />
            </div>

            {/* Active Status */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-[#363636] bg-[#262626] text-[#7E3FF2] focus:ring-[#7E3FF2]/20"
                />
                <label
                  htmlFor="active"
                  className="ml-2 block text-sm font-medium text-zinc-300"
                >
                  {t("categories.active") || "Active"}
                </label>
              </div>
              <p className="text-xs text-zinc-400">
                {t("categories.activeDescription") ||
                  "Inactive categories won't appear in selection dropdowns"}
              </p>
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
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-[#363636] rounded-md shadow-sm text-sm font-medium text-white bg-[#262626] hover:bg-[#363636] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#121212] focus:ring-[#7E3FF2]"
            >
              {t("common.reset")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="relative overflow-hidden px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#F2B705] to-[#F29F05] hover:from-[#F2C438] hover:to-[#F2A81F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#121212] focus:ring-[#F2B705] disabled:opacity-70"
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

export default CategoryForm;
