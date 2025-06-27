import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import CategoryForm from "../../components/categories/CategoryForm";
import { useCategories } from "../../hooks/useCategories";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionGuard from "../../components/PermissionGuard";

const AddCategory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addCategory } = useCategories();
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (categoryData) => {
    try {
      setFormError(null);

      await addCategory(categoryData);
      setSuccess(true);
      setTimeout(() => {
        navigate("/inventory/products");
      }, 2000);
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to add category");
      console.error("Error adding category:", err);
    }
  };

  return (
    <PermissionGuard module="categories" action="create" showFallback>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {t("categories.addCategory") || "Add Category"}
          </h1>
          <button
            onClick={() => navigate("/inventory/products")}
            className="px-4 py-2 rounded-md border border-[#363636] bg-[#262626] hover:bg-[#363636] text-white flex items-center gap-2"
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
              <path d="m15 18-6-6 6-6" />
            </svg>
            {t("common.back")}
          </button>
        </div>

        {formError && (
          <div className="bg-[#F23557]/10 border border-[#F23557]/20 text-[#F23557] px-4 py-3 rounded-md mb-6">
            {formError}
          </div>
        )}

        {success && (
          <div className="bg-[#36F2A3]/10 border border-[#36F2A3]/20 text-[#36F2A3] px-4 py-3 rounded-md mb-6">
            {t("categories.addSuccess") || "Category added successfully!"}
          </div>
        )}

        <CategoryForm
          onSubmit={handleSubmit}
          onCancel={() => navigate("/inventory/products")}
        />
      </div>
    </PermissionGuard>
  );
};

export default AddCategory;
