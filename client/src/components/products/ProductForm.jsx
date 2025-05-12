import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useProducts } from "../../hooks/useProducts";
import { useCategories } from "../../hooks/useCategories";
import axios from "axios";

const ProductForm = ({
  onSubmit,
  initialData = {},
  onCancel,
  existingProducts = [],
}) => {
  const { t } = useTranslation();
  const { searchProducts } = useProducts();
  const { categories } = useCategories();

  const [formData, setFormData] = useState({
    sku: initialData.sku || "",
    barcode: initialData.barcode || "",
    name: {
      en: initialData.name?.en || "",
      ku: initialData.name?.ku || "",
    },
    description: {
      en: initialData.description?.en || "",
      ku: initialData.description?.ku || "",
    },
    category: initialData.category || "",
    price: initialData.price || "",
    cost: initialData.cost || "",
    quantity: initialData.quantity || 1,
    reorderLevel: initialData.reorderLevel || "10",
    active: initialData.active !== undefined ? initialData.active : true,
    imageUrl:
      initialData.imageUrl ||
      (initialData.images && initialData.images.length > 0
        ? initialData.images[0]
        : ""),
    ...initialData,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExistingProduct, setIsExistingProduct] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // State for hierarchical category selection
  const [parentCategories, setParentCategories] = useState([]);
  const [childCategories, setChildCategories] = useState({});
  const [selectedParentCategory, setSelectedParentCategory] = useState("");
  const [categoryChain, setCategoryChain] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(0);

  // Process categories into parent-child structure
  useEffect(() => {
    if (!categories || !Array.isArray(categories)) return;

    const parents = categories.filter((cat) => !cat.parent);
    const children = {};

    // Group all categories by their parent ID
    categories.forEach((cat) => {
      if (cat.parent) {
        if (!children[cat.parent]) {
          children[cat.parent] = [];
        }
        children[cat.parent].push(cat);
      }
    });

    setParentCategories(parents);
    setChildCategories(children);

    // If there's an initialData.category, set up the category chain
    if (initialData.category) {
      const selectedCategory = categories.find(
        (cat) => cat._id === initialData.category
      );

      if (selectedCategory) {
        // Set the initial category chain based on the selected category
        if (selectedCategory.parent) {
          // This is a child category, we need to build the chain
          const buildCategoryChain = (catId) => {
            const chain = [];
            let current = categories.find((c) => c._id === catId);

            while (current) {
              if (current.parent) {
                // Add each parent to the beginning of the chain
                chain.unshift(current.parent);
                // Look for the next parent
                current = categories.find((c) => c._id === current.parent);
              } else {
                // Reached the top-level category
                break;
              }
            }

            return chain;
          };

          const chain = buildCategoryChain(selectedCategory._id);
          if (chain.length > 0) {
            setSelectedParentCategory(chain[0]);
            setCategoryChain([...chain, selectedCategory._id]);
            setCurrentLevel(chain.length);
          }
        } else {
          // This is a top-level category
          setSelectedParentCategory(selectedCategory._id);
          setCategoryChain([selectedCategory._id]);
          setCurrentLevel(0);
        }
      }
    }
  }, [categories, initialData.category]);

  // When a parent category is selected, update the category chain
  const handleParentCategoryChange = (e) => {
    const parentId = e.target.value;
    setSelectedParentCategory(parentId);

    // Reset the category chain with only the parent
    setCategoryChain(parentId ? [parentId] : []);
    setCurrentLevel(0);

    // Set the selected category to the parent
    setFormData({
      ...formData,
      category: parentId || "",
    });
  };

  // Handle category selection at any level in the hierarchy
  const handleCategoryChange = (e, level) => {
    const categoryId = e.target.value;

    // Update category chain up to this level and remove deeper levels
    const newChain = [...categoryChain.slice(0, level), categoryId];
    setCategoryChain(newChain);

    // Set the current level to the level of the changed category
    setCurrentLevel(level);

    // Update the selected category
    setFormData({
      ...formData,
      category: categoryId,
    });
  };

  // Function to check if a category has children
  const hasChildren = (categoryId) => {
    return (
      childCategories[categoryId] && childCategories[categoryId].length > 0
    );
  };

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

  const handleExistingProductSelect = (product) => {
    // Copy all product data except barcode
    setFormData({
      ...product,
      barcode: "", // Clear existing barcode
      _id: undefined, // Clear ID to avoid updating existing product
      isNewBarcode: true, // Flag to indicate this is a new barcode for an existing product
      // Ensure name and description are properly structured as objects
      name: {
        en: product.name?.en || product.name || "",
        ku: product.name?.ku || "",
      },
      description: {
        en: product.description?.en || product.description || "",
        ku: product.description?.ku || "",
      },
      // Handle missing or malformed data
      category: product.category?._id || product.category || "",
      price: product.price || 0,
      cost: product.cost || 0,
      reorderLevel: product.reorderLevel || 10,
      active: product.active !== undefined ? product.active : true,
      imageUrl:
        product.images && product.images.length > 0
          ? product.images[0]
          : product.imageUrl || "", // Get image from images array if available
    });
    setSearchResults([]);
    setSearchQuery("");
    setIsExistingProduct(true);
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchProducts(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.sku.trim()) {
      newErrors.sku = t("validation.required");
    }

    if (!formData.barcode.trim()) {
      newErrors.barcode = t("validation.required");
    }

    if (!formData.name.en.trim()) {
      newErrors["name.en"] = t("validation.required");
    }

    if (!selectedParentCategory) {
      newErrors.category = t("validation.requiredCategory");
    } else if (!formData.category) {
      // Set default category to parent if none selected
      setFormData({
        ...formData,
        category: selectedParentCategory,
      });
    }

    if (!formData.price) {
      newErrors.price = t("validation.required");
    } else if (isNaN(formData.price) || Number(formData.price) < 0) {
      newErrors.price = t("validation.invalidNumber");
    }

    if (!formData.cost) {
      newErrors.cost = t("validation.required");
    } else if (isNaN(formData.cost) || Number(formData.cost) < 0) {
      newErrors.cost = t("validation.invalidNumber");
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
      const productData = {
        sku: formData.sku,
        barcode: formData.barcode,
        name: {
          en: formData.name.en,
          ku: formData.name.ku || undefined,
        },
        description: {
          en: formData.description.en || undefined,
          ku: formData.description.ku || undefined,
        },
        category: formData.category,
        price: Number(formData.price),
        cost: Number(formData.cost),
        quantity: Number(formData.quantity),
        reorderLevel: Number(formData.reorderLevel),
        active: formData.active,
        isNewBarcode: formData.isNewBarcode,
        imageUrl: formData.imageUrl,
        images: formData.imageUrl ? [formData.imageUrl] : [],
      };

      await onSubmit(productData);

      // Reset form after successful submission
      if (!initialData._id) {
        setFormData({
          sku: "",
          barcode: "",
          name: { en: "", ku: "" },
          description: { en: "", ku: "" },
          category: "",
          price: "",
          cost: "",
          reorderLevel: "10",
          active: true,
          imageUrl: "",
        });
        setIsExistingProduct(false);
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
      sku: "",
      barcode: "",
      name: { en: "", ku: "" },
      description: { en: "", ku: "" },
      category: "",
      price: "",
      cost: "",
      quantity: 1,
      reorderLevel: "10",
      active: true,
      imageUrl: "",
    });
    setIsExistingProduct(false);
    setSearchQuery("");
    setSearchResults([]);
    setErrors({});
    setSelectedParentCategory("");
    setCategoryChain([]);
    setCurrentLevel(0);
  };

  // Generate a random barcode using the API
  const generateBarcode = async () => {
    try {
      const response = await axios.get("/api/products/generate-barcode");

      if (response.data.barcode) {
        setFormData({
          ...formData,
          barcode: response.data.barcode,
        });
      }
    } catch (error) {
      console.error("Error generating barcode:", error);
      // Fallback to client-side generation if API fails
      generateBarcodeLocally();
    }
  };

  // Fallback function for local barcode generation
  const generateBarcodeLocally = () => {
    // Generate a 12-digit barcode (not including the check digit)
    const countryCode = "999"; // Internal use
    const manufacturerCode = "0001"; // Store code

    // Random 5-digit product code
    const productCode = Math.floor(10000 + Math.random() * 90000).toString();

    // Combine without check digit
    const barcodeWithoutCheck = `${countryCode}${manufacturerCode}${productCode}`;

    // Calculate check digit (sum of odd positions + 3x sum of even positions)
    let oddSum = 0;
    let evenSum = 0;

    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcodeWithoutCheck[i], 10);
      if (i % 2 === 0) {
        oddSum += digit;
      } else {
        evenSum += digit;
      }
    }

    const total = oddSum + evenSum * 3;
    const checkDigit = (10 - (total % 10)) % 10;

    // Complete barcode
    const barcode = `${barcodeWithoutCheck}${checkDigit}`;

    // Update form data
    setFormData({
      ...formData,
      barcode,
    });
  };

  // Generate barcode automatically for new products
  useEffect(() => {
    // If this is a new product (no initial data) and barcode field is empty
    if (!initialData._id && !formData.barcode) {
      generateBarcode();
    }
  }, []);

  return (
    <div className="w-full overflow-hidden bg-gradient-to-br from-[#121212] to-[#1E1E1E] border border-[#262626] rounded-lg shadow-lg">
      <div className="relative p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.form && (
            <div className="bg-[#F23557]/10 border border-[#F23557]/20 text-[#F23557] px-4 py-3 rounded-md">
              {errors.form}
            </div>
          )}

          {/* Product Source Selection */}
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
                <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
              </svg>
              {t("products.chooseSource") || "Choose Product Source"}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-[#262626] p-4 rounded-md">
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="existingProduct"
                    checked={isExistingProduct}
                    onChange={(e) => setIsExistingProduct(e.target.checked)}
                    className="w-4 h-4 text-[#7E3FF2] rounded border-[#363636] focus:ring-[#7E3FF2]/20 focus:ring-offset-[#121212]"
                  />
                  <label
                    htmlFor="existingProduct"
                    className="text-sm font-medium text-white"
                  >
                    {t("products.useExisting") ||
                      "Use existing product (copy product details and add new barcode)"}
                  </label>
                </div>

                {isExistingProduct && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-300">
                      {t("products.searchProducts") || "Search Products"}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder={
                          t("products.searchPlaceholder") ||
                          "Search by name, SKU, or barcode..."
                        }
                        className="w-full h-10 rounded-md border border-[#363636] bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
                      />
                      {searchLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#7E3FF2]"></div>
                        </div>
                      )}
                    </div>

                    {searchResults.length > 0 && (
                      <div className="mt-2 max-h-60 overflow-y-auto bg-[#1A1A1A] border border-[#363636] rounded-md">
                        {searchResults.map((product) => (
                          <div
                            key={product._id}
                            onClick={() => handleExistingProductSelect(product)}
                            className="p-3 border-b border-[#363636] last:border-b-0 hover:bg-[#2A2A2A] cursor-pointer"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-white font-medium">
                                  {product.name.en}
                                </p>
                                <p className="text-xs text-zinc-400">
                                  SKU: {product.sku}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[#36F2A3] font-bold">
                                  ${product.price.toFixed(2)}
                                </p>
                                <p className="text-xs text-zinc-400">
                                  {t("products.stock")}: {product.quantity}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-[#363636] pt-4"></div>

          {/* Basic Information */}
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
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 7h.01" />
                <path d="M17 7h.01" />
                <path d="M7 17h.01" />
                <path d="M17 17h.01" />
              </svg>
              {t("products.basicInfo") || "Basic Information"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="sku"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("products.sku")} <span className="text-[#F23557]">*</span>
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className={`w-full h-10 rounded-md border ${
                    errors.sku ? "border-[#F23557]" : "border-[#363636]"
                  } bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]`}
                />
                {errors.sku && (
                  <p className="text-[#F23557] text-xs mt-1">{errors.sku}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="barcode"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("products.barcode")}{" "}
                  <span className="text-[#F23557]">*</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="barcode"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    className={`w-full h-10 rounded-md border ${
                      errors.barcode ? "border-[#F23557]" : "border-[#363636]"
                    } bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]`}
                  />
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="px-3 h-10 bg-[#7E3FF2] hover:bg-[#6E2FE2] rounded-md text-white flex items-center justify-center flex-shrink-0"
                    title={t("products.generateBarcode") || "Generate barcode"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 7V4h17v7"></path>
                      <path d="M12 20H2V8h14"></path>
                      <path d="M7 12v5"></path>
                      <path d="M6 13h2"></path>
                      <rect width="6" height="6" x="16" y="16" rx="1"></rect>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, barcode: "" })}
                    className="px-3 h-10 bg-[#444] hover:bg-[#333] rounded-md text-white flex items-center justify-center flex-shrink-0"
                    title={t("products.clearBarcode") || "Clear barcode"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
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
                </div>
                {errors.barcode && (
                  <p className="text-[#F23557] text-xs mt-1">
                    {errors.barcode}
                  </p>
                )}
                <p className="text-xs text-zinc-400 mt-1">
                  {t("products.barcodeHint") ||
                    "Barcode is auto-generated for new products. You can generate a new one or enter manually."}
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="name.en"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("products.nameEn")}{" "}
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

              <div className="space-y-2">
                <label
                  htmlFor="name.ku"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("products.nameKu")}
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

              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("products.category")}{" "}
                  <span className="text-[#F23557]">*</span>
                </label>

                {/* Parent Category Selection */}
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="parentCategory"
                      className="block text-xs text-zinc-400 mb-1"
                    >
                      {t("products.parentCategory") || "Parent Category"}
                    </label>
                    <select
                      id="parentCategory"
                      name="parentCategory"
                      value={selectedParentCategory}
                      onChange={handleParentCategoryChange}
                      className="w-full h-10 rounded-md border border-[#363636] bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
                    >
                      <option value="">{t("products.selectCategory")}</option>
                      {parentCategories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name.en}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Show subcategory selections for each level in the hierarchy */}
                  {selectedParentCategory &&
                    categoryChain.map((categoryId, index) => {
                      // For each level, check if the category at this level has children
                      const nextLevelCategories =
                        childCategories[categoryId] || [];

                      // Only show next level if there are children
                      if (
                        nextLevelCategories.length > 0 &&
                        index === currentLevel
                      ) {
                        return (
                          <div key={`level-${index + 1}`}>
                            <label
                              htmlFor={`category-level-${index + 1}`}
                              className="block text-xs text-zinc-400 mb-1"
                            >
                              {t("products.subCategory") || "Sub Category"}{" "}
                              {index + 1}
                            </label>
                            <select
                              id={`category-level-${index + 1}`}
                              name={`category-level-${index + 1}`}
                              value={categoryChain[index + 1] || ""}
                              onChange={(e) =>
                                handleCategoryChange(e, index + 1)
                              }
                              className="w-full h-10 rounded-md border border-[#363636] bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
                            >
                              <option value="">
                                {t("products.selectSubCategory") ||
                                  "Select Sub-Category"}
                              </option>
                              {nextLevelCategories.map((category) => (
                                <option key={category._id} value={category._id}>
                                  {category.name.en}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }
                      return null;
                    })}
                </div>

                {errors.category && (
                  <p className="text-[#F23557] text-xs mt-1">
                    {errors.category}
                  </p>
                )}

                {/* Display the currently selected category path */}
                {categoryChain.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-zinc-400">
                      {t("products.selectedCategory") || "Selected Category"}:{" "}
                      <span className="text-white">
                        {categoryChain.map((catId, idx) => {
                          const cat = categories.find((c) => c._id === catId);
                          return cat ? (
                            <span key={catId}>
                              {idx > 0 && " > "}
                              {cat.name.en}
                            </span>
                          ) : null;
                        })}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="productImage"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("products.image") || "Product Image"}
                </label>
                <div className="flex items-center space-x-4">
                  {formData.imageUrl && (
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border border-[#363636]">
                      <img
                        src={formData.imageUrl}
                        alt={formData.name.en}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, imageUrl: "" })
                        }
                        className="absolute top-1 right-1 bg-[#262626] p-1 rounded-full"
                        title={t("products.removeImage") || "Remove image"}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 text-white"
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
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="text"
                      id="imageUrl"
                      name="imageUrl"
                      placeholder={
                        t("products.imageUrlPlaceholder") || "Enter image URL"
                      }
                      value={formData.imageUrl || ""}
                      onChange={handleChange}
                      className="w-full h-10 rounded-md border border-[#363636] bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
                    />
                    <p className="text-xs text-zinc-400 mt-1">
                      {t("products.imageHint") ||
                        "Enter a URL for the product image. The image will be stored as a reference."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="description.en"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("products.descriptionEn")}
                </label>
                <textarea
                  id="description.en"
                  name="description.en"
                  value={formData.description.en}
                  onChange={handleChange}
                  rows="3"
                  className="w-full rounded-md border border-[#363636] bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
                ></textarea>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="description.ku"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("products.descriptionKu")}
                </label>
                <textarea
                  id="description.ku"
                  name="description.ku"
                  value={formData.description.ku}
                  onChange={handleChange}
                  rows="3"
                  className="w-full rounded-md border border-[#363636] bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="border-t border-[#363636] pt-4"></div>

          {/* Pricing & Inventory */}
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
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <path d="M13 5v2" />
                <path d="M13 17v2" />
                <path d="M13 11v2" />
              </svg>
              {t("products.pricingInventory") || "Pricing & Inventory"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("products.price")}{" "}
                  <span className="text-[#F23557]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    $
                  </span>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    className={`w-full h-10 rounded-md border ${
                      errors.price ? "border-[#F23557]" : "border-[#363636]"
                    } bg-[#262626] text-white pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]`}
                  />
                </div>
                {errors.price && (
                  <p className="text-[#F23557] text-xs mt-1">{errors.price}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="cost"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("products.cost")} <span className="text-[#F23557]">*</span>
                  {isExistingProduct && (
                    <span className="text-xs text-gray-400 ml-1">
                      ({t("products.batchCost") || "Batch Cost"})
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    $
                  </span>
                  <input
                    type="number"
                    id="cost"
                    name="cost"
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={handleChange}
                    className={`w-full h-10 rounded-md border ${
                      errors.cost ? "border-[#F23557]" : "border-[#363636]"
                    } bg-[#262626] text-white pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]`}
                  />
                </div>
                {errors.cost && (
                  <p className="text-[#F23557] text-xs mt-1">{errors.cost}</p>
                )}
                {isExistingProduct && (
                  <p className="text-xs text-gray-400 mt-1">
                    {t("products.costExplanation") ||
                      "This cost will be recorded for this specific batch of products. The average cost will be calculated automatically."}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("products.quantity")} *
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md bg-[#1e1e1e] border-[#363636] focus:border-[#5e5e5e] focus:outline-none"
                  required
                />
                {errors.quantity && (
                  <p className="text-[#F23557] text-xs mt-1">
                    {errors.quantity}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="reorderLevel"
                  className="block text-sm font-medium text-zinc-300"
                >
                  {t("products.reorderLevel")}
                </label>
                <input
                  type="number"
                  id="reorderLevel"
                  name="reorderLevel"
                  min="0"
                  value={formData.reorderLevel}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-[#363636] bg-[#262626] text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7E3FF2]/20 focus:border-[#7E3FF2]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#7E3FF2] rounded border-[#363636] focus:ring-[#7E3FF2]/20 focus:ring-offset-[#121212]"
                  />
                  <label
                    htmlFor="active"
                    className="text-sm font-medium text-white"
                  >
                    {t("products.active") ||
                      "Active product (available for sale)"}
                  </label>
                </div>
                <p className="text-xs text-zinc-400">
                  {t("products.quantityNote") ||
                    "Note: Identical products (same SKU) share the same barcode and will be added to the existing quantity."}
                </p>
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
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-[#363636] rounded-md shadow-sm text-sm font-medium text-white bg-[#262626] hover:bg-[#363636] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#121212] focus:ring-[#7E3FF2]"
            >
              {t("common.reset")}
            </button>
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

export default ProductForm;
