import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import ProductForm from "../../components/products/ProductForm";
import CostHistoryTable from "../../components/products/CostHistoryTable";
import { useProducts } from "../../hooks/useProducts";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionGuard from "../../components/PermissionGuard";

const EditProduct = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    updateProduct,
    getProduct,
    products,
    error: productsError,
  } = useProducts();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showCostHistory, setShowCostHistory] = useState(false);

  // Fetch product data when component mounts
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const productData = await getProduct(id);
        setProduct(productData);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch product");
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleSubmit = async (productData) => {
    try {
      setError(null);
      await updateProduct(id, productData);
      setSuccess(true);

      // Redirect after successful update
      setTimeout(() => {
        navigate("/inventory/products");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update product");
      console.error("Error updating product:", err);
    }
  };

  if (loading) {
    return (
      <PermissionGuard module="products" action="edit" showFallback>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7E3FF2]"></div>
        </div>
      </PermissionGuard>
    );
  }

  if (error) {
    return (
      <PermissionGuard module="products" action="edit" showFallback>
        <div className="bg-[#F23557]/10 border border-[#F23557]/20 text-[#F23557] px-4 py-3 rounded-md">
          {error}
        </div>
      </PermissionGuard>
    );
  }

  if (!product) {
    return (
      <PermissionGuard module="products" action="edit" showFallback>
        <div className="bg-[#F23557]/10 border border-[#F23557]/20 text-[#F23557] px-4 py-3 rounded-md">
          {t("products.notFound")}
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard module="products" action="edit" showFallback>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t("products.editProduct")}</h1>
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

        {error && (
          <div className="bg-[#F23557]/10 border border-[#F23557]/20 text-[#F23557] px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-[#36F2A3]/10 border border-[#36F2A3]/20 text-[#36F2A3] px-4 py-3 rounded-md mb-6">
            {t("products.updateSuccess")}
          </div>
        )}

        {/* Cost History Section */}
        {product.costHistory && product.costHistory.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {t("products.costHistory") || "Cost History"}
              </h2>
              <button
                onClick={() => setShowCostHistory(!showCostHistory)}
                className="px-3 py-1 rounded-md border border-[#363636] bg-[#262626] hover:bg-[#363636] text-white text-sm"
              >
                {showCostHistory
                  ? t("common.hide") || "Hide"
                  : t("common.show") || "Show"}
              </button>
            </div>

            {showCostHistory && (
              <CostHistoryTable costHistory={product.costHistory} />
            )}
          </div>
        )}

        <ProductForm
          onSubmit={handleSubmit}
          initialData={product}
          onCancel={() => navigate("/inventory/products")}
        />
      </div>
    </PermissionGuard>
  );
};

export default EditProduct;
