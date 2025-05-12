import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ProductForm from "../../components/products/ProductForm";
import { useProducts } from "../../hooks/useProducts";

const AddProduct = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addProduct, incrementQuantity, products, error } = useProducts();
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (productData) => {
    try {
      setFormError(null);

      // Check if this is a product with an existing SKU
      const existingProduct = products.find((p) => p.sku === productData.sku);

      if (existingProduct) {
        // Increment the quantity of the existing product by the specified quantity
        // and track the cost for this specific batch
        await incrementQuantity(existingProduct._id, {
          quantity: productData.quantity || 1,
          cost: productData.cost,
        });

        setSuccess(true);
        setTimeout(() => {
          navigate("/inventory/products");
        }, 2000);
        return;
      }

      // For completely new products
      const newProductData = {
        ...productData,
        quantity: productData.quantity || 1, // Use the specified quantity
      };

      await addProduct(newProductData);
      setSuccess(true);
      setTimeout(() => {
        navigate("/inventory/products");
      }, 2000);
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to add product");
      console.error("Error adding product:", err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("products.addProduct")}</h1>
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
          {t("products.addSuccess")}
        </div>
      )}

      <ProductForm
        onSubmit={handleSubmit}
        onCancel={() => navigate("/inventory/products")}
        existingProducts={products}
      />
    </div>
  );
};

export default AddProduct;
