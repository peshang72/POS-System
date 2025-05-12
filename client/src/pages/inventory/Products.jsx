import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../../hooks/useProducts";
import { useCategories } from "../../hooks/useCategories";
import { useState, useMemo, useEffect } from "react";
import axios from "axios";

// CSS for custom scrollbar
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #262626;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const Products = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { products, isLoading, error, deleteProduct } = useProducts();
  const { categories } = useCategories();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const productsPerPage = 20;

  // Organize categories into a hierarchical structure
  const [parentCategories, setParentCategories] = useState([]);
  const [childCategories, setChildCategories] = useState({});
  const [visibleChildCategories, setVisibleChildCategories] = useState([]);

  // State to track all descendant categories of selected categories
  const [allDescendantCategories, setAllDescendantCategories] = useState([]);

  // Process categories into parent-child structure
  useEffect(() => {
    if (!categories || !Array.isArray(categories)) return;

    const parents = categories.filter((cat) => !cat.parent);
    const children = {};

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
  }, [categories]);

  // Update visible child categories whenever selected categories change
  useEffect(() => {
    const visible = [];
    selectedCategories.forEach((catId) => {
      if (childCategories[catId]) {
        visible.push(...childCategories[catId].map((child) => child._id));
      }
    });
    setVisibleChildCategories(visible);
  }, [selectedCategories, childCategories]);

  // Update all descendants whenever selected categories change
  useEffect(() => {
    // Create an array to hold all categories we want to include (selected + descendants)
    let categoriesToInclude = [];

    // For each selected category
    selectedCategories.forEach((catId) => {
      // Always include the selected category itself
      categoriesToInclude.push(catId);

      // If this is a parent category with children, include all descendants
      const collectDescendants = (parentId) => {
        // Get direct children
        const children = childCategories[parentId] || [];

        // Add each child to our list
        children.forEach((child) => {
          categoriesToInclude.push(child._id);
          // Recursively collect this child's descendants
          collectDescendants(child._id);
        });
      };

      // Collect all descendants of this category
      collectDescendants(catId);
    });

    // Remove any duplicates
    categoriesToInclude = [...new Set(categoriesToInclude)];
    setAllDescendantCategories(categoriesToInclude);

    // For debugging - remove in production
    console.log("Selected categories:", selectedCategories);
    console.log("All descendants:", categoriesToInclude);
  }, [selectedCategories, childCategories]);

  // Check if a product belongs to a selected category or any of its descendants
  const productMatchesSelectedCategories = (product) => {
    if (selectedCategories.length === 0) return true;
    if (!product.category) return false;

    const productCategoryId =
      typeof product.category === "object"
        ? product.category._id
        : product.category;

    // Enhanced debugging - log product information
    const productName = product.name?.en || "Unknown";

    // Direct check - if we've selected Laptop Stand (No Fan), we should not see Laptop Stand (Fan) products
    // Check if we have a specific case where the product's exact match is important
    const isLeafSelected = selectedCategories.some((catId) => {
      // Check if this is a leaf category
      const isLeaf =
        !childCategories[catId] || childCategories[catId].length === 0;

      if (isLeaf) {
        console.log(`Leaf category selected: ${catId}`);
        // If product matches this specific leaf, allow it
        if (productCategoryId === catId) {
          console.log(
            `Product ${productName} directly matches selected leaf category ${catId}`
          );
          return true;
        }
        // Otherwise, we need to check parent-child relationships
        return false;
      }
      return false;
    });

    // If we have a leaf category selected but product doesn't match it directly, check further

    // Simple map of category ID to category name for debugging
    const categoryNames = {};
    categories.forEach((cat) => {
      categoryNames[cat._id] = cat.name?.en || "Unknown";
    });

    console.log(
      `Checking product: ${productName} (${productCategoryId}) against selected categories`
    );
    console.log(
      `Selected categories: ${selectedCategories
        .map((id) => `${id} (${categoryNames[id] || "Unknown"})`)
        .join(", ")}`
    );

    // Find leaf categories in our selection (categories with no children)
    const selectedLeaves = selectedCategories.filter(
      (catId) => !childCategories[catId] || childCategories[catId].length === 0
    );

    console.log(
      `Selected leaf categories: ${selectedLeaves
        .map((id) => `${id} (${categoryNames[id] || "Unknown"})`)
        .join(", ")}`
    );

    // If we have selected leaf categories, check if product belongs to any of them
    if (selectedLeaves.length > 0) {
      const matches = selectedLeaves.includes(productCategoryId);
      console.log(
        `Product ${productName} ${
          matches ? "matches" : "does not match"
        } selected leaf categories`
      );

      // EXTREMELY IMPORTANT: If we have selected specific leaf categories,
      // ONLY show products that match those exact leaves
      return matches;
    }

    // If we don't have leaf categories selected, handle parent-child relationships

    // Find all parent categories that have selected children
    const parentsWithSelectedChildren = {};

    selectedCategories.forEach((catId) => {
      Object.entries(childCategories).forEach(([parentId, children]) => {
        if (
          selectedCategories.includes(parentId) &&
          children.some((child) => child._id === catId) &&
          catId !== parentId
        ) {
          if (!parentsWithSelectedChildren[parentId]) {
            parentsWithSelectedChildren[parentId] = [];
          }
          parentsWithSelectedChildren[parentId].push(catId);
        }
      });
    });

    console.log("Parents with selected children:", parentsWithSelectedChildren);

    // If we have parent-child selections
    if (Object.keys(parentsWithSelectedChildren).length > 0) {
      for (const [parentId, childrenIds] of Object.entries(
        parentsWithSelectedChildren
      )) {
        // Check if product belongs to parent
        if (productCategoryId === parentId) {
          console.log(
            `Product ${productName} matches parent ${parentId} but we've selected specific children`
          );
          return false;
        }

        // Get all descendants of the parent
        const getAllDescendants = (id, result = []) => {
          const children = childCategories[id] || [];
          children.forEach((child) => {
            result.push(child._id);
            getAllDescendants(child._id, result);
          });
          return result;
        };

        const parentDescendants = getAllDescendants(parentId);

        // If product is a descendant of this parent
        if (parentDescendants.includes(productCategoryId)) {
          console.log(
            `Product ${productName} is a descendant of parent ${parentId}`
          );

          // Get all descendants of the selected children
          let allowedCategories = [];
          childrenIds.forEach((childId) => {
            allowedCategories.push(childId);
            getAllDescendants(childId, allowedCategories);
          });

          const isAllowed = allowedCategories.includes(productCategoryId);
          console.log(
            `Product ${productName} ${
              isAllowed ? "matches" : "does not match"
            } allowed categories under selected children`
          );

          return isAllowed;
        }
      }
    }

    // For remaining categories with no special handling
    const remainingCategories = selectedCategories.filter((catId) => {
      // Not in a parent-child relationship
      return (
        !Object.keys(parentsWithSelectedChildren).includes(catId) &&
        !Object.values(parentsWithSelectedChildren).flat().includes(catId)
      );
    });

    console.log("Remaining categories:", remainingCategories);

    // Process remaining categories normally
    if (remainingCategories.length > 0) {
      const getAllDescendants = (categoryId, result = []) => {
        const children = childCategories[categoryId] || [];
        children.forEach((child) => {
          result.push(child._id);
          getAllDescendants(child._id, result);
        });
        return result;
      };

      let categoriesToCheck = [];
      remainingCategories.forEach((catId) => {
        categoriesToCheck.push(catId);
        getAllDescendants(catId, categoriesToCheck);
      });

      console.log(
        "Categories to check for remaining categories:",
        categoriesToCheck
      );

      const matches = categoriesToCheck.includes(productCategoryId);
      console.log(
        `Product ${productName} ${
          matches ? "matches" : "does not match"
        } remaining categories`
      );

      return matches;
    }

    console.log(`Product ${productName} didn't match any selection criteria`);
    return false;
  };

  // Toggle category selection
  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        // If we're removing a parent, also remove all descendants at any level
        const newSelection = prev.filter((id) => id !== categoryId);

        // Function to get all descendants of a category at any depth
        const getAllDescendants = (parentId, result = []) => {
          if (childCategories[parentId]) {
            for (const child of childCategories[parentId]) {
              result.push(child._id);
              getAllDescendants(child._id, result);
            }
          }
          return result;
        };

        // Get all descendants of the category being removed
        const allDescendants = getAllDescendants(categoryId);
        console.log(
          `Deselecting ${categoryId} and its descendants:`,
          allDescendants
        );

        // Filter out all descendants from the selection
        return newSelection.filter((id) => !allDescendants.includes(id));
      } else {
        // Simply add the category to the selection
        // Parent categories remain selected when their children are selected
        return [...prev, categoryId];
      }
    });

    // Reset to first page when changing category filters
    setCurrentPage(1);
  };

  // Clear all selected categories
  const clearCategoryFilters = () => {
    setSelectedCategories([]);
    setCurrentPage(1);
  };

  // Filter products based on search term and selected categories
  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];

    try {
      console.log(
        "Filtering products with selected categories:",
        selectedCategories
      );

      const filtered = products.filter((product) => {
        // Search term filter
        const matchesSearch =
          (product.name?.en?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (product.name?.ku?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (product.sku?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (product.barcode || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          // Search by category name if available
          (product.category &&
            typeof product.category === "object" &&
            ((product.category.name?.en?.toLowerCase() || "").includes(
              searchTerm.toLowerCase()
            ) ||
              (product.category.name?.ku?.toLowerCase() || "").includes(
                searchTerm.toLowerCase()
              )));

        // If search doesn't match, no need to check categories
        if (!matchesSearch) return false;

        // Category filter with special rules
        const matchesCategory = productMatchesSelectedCategories(product);

        return matchesCategory;
      });

      console.log(
        `Filtered products: ${filtered.length} out of ${products.length}`
      );
      console.log(
        "Filtered product names:",
        filtered.map((p) => p.name?.en).join(", ")
      );

      return filtered;
    } catch (error) {
      console.error("Error filtering products:", error);
      return [];
    }
  }, [products, searchTerm, selectedCategories, childCategories, categories]);

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // When search term changes, reset to first page
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Function to export products to CSV for barcode printing
  const exportProductsToCSV = async () => {
    try {
      // Use axios to make a request with the default headers that include authorization
      const response = await axios.get(
        "/api/products/export-barcodes?active=true",
        {
          responseType: "blob", // Important for file downloads
        }
      );

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Create a link element to trigger download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "product_barcodes.csv");

      // Append to document and trigger click
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting products:", error);
      alert("Failed to export products");
    }
  };

  // Function to handle deletion of a product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete._id);
      setDeleteSuccess(true);
      setDeleteError(null);

      // Close modal after a short delay to show success message
      setTimeout(() => {
        setShowDeleteModal(false);
        setProductToDelete(null);
        setDeleteSuccess(false);
      }, 1500);
    } catch (error) {
      setDeleteError(error.response?.data?.error || "Failed to delete product");
      console.error("Error deleting product:", error);
    }
  };

  // Function to open delete confirmation modal
  const confirmDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
    setDeleteError(null);
    setDeleteSuccess(false);
  };

  return (
    <div>
      <style>{customScrollbarStyles}</style>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("products.products")}</h1>
        <div className="flex space-x-3">
          <button
            onClick={exportProductsToCSV}
            className="px-4 py-2 rounded-md bg-[#36F2A3] hover:bg-[#2DD38A] text-gray-800 flex items-center gap-2"
            title="Export products to CSV for label printing"
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t("products.exportLabels") || "Export Labels"}
          </button>
          <button
            onClick={() => navigate("/inventory/categories/add")}
            className="px-4 py-2 rounded-md bg-[#F2B705] hover:bg-[#D9A404] text-gray-800 flex items-center gap-2"
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
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
            {t("categories.add") || "Add Category"}
          </button>
          <button
            onClick={() => navigate("/inventory/products/add")}
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
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t("products.add")}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            className="w-full px-4 py-2 pl-10 rounded-md bg-[#262626] border border-[#363636] text-white focus:outline-none focus:ring-2 focus:ring-[#7E3FF2] focus:border-transparent"
            placeholder={
              t("products.searchProducts") ||
              "Search products by name, SKU or barcode"
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3 top-2.5 text-zinc-400">
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
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          {searchTerm && (
            <button
              className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
              onClick={() => setSearchTerm("")}
              title={t("common.clear") || "Clear search"}
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category Filters */}
      {parentCategories && parentCategories.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-zinc-300">
              {t("products.filterByCategory") || "Filter by Category"}
              {selectedCategories.length > 0 &&
                ` (${selectedCategories.length})`}
            </h3>
            {selectedCategories.length > 0 && (
              <button
                onClick={clearCategoryFilters}
                className="text-xs text-[#3D9CF2] hover:text-[#7E3FF2]"
              >
                {t("common.clearAll") || "Clear All"}
              </button>
            )}
          </div>

          {/* Parent Categories */}
          <div className="mb-2">
            <div className="flex flex-wrap justify-center gap-2 max-h-[120px] overflow-y-auto custom-scrollbar p-1">
              {parentCategories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => toggleCategory(category._id)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap ${
                    selectedCategories.includes(category._id)
                      ? "bg-[#7E3FF2] text-white"
                      : "bg-[#262626] text-zinc-300 hover:bg-[#363636]"
                  }`}
                >
                  {category.name.en}
                  {selectedCategories.includes(category._id) && (
                    <span className="ml-1">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Child Categories - Only show if parent categories are selected */}
          {selectedCategories.length > 0 &&
            selectedCategories.some(
              (id) => childCategories[id] && childCategories[id].length > 0
            ) && (
              <div>
                <div className="text-xs text-zinc-400 mb-1 ml-1">
                  {t("products.subcategories") || "Subcategories"}:
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-h-[120px] overflow-y-auto custom-scrollbar p-1">
                  {selectedCategories.map((parentId) =>
                    childCategories[parentId]?.map((child) => (
                      <button
                        key={child._id}
                        onClick={() => toggleCategory(child._id)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap flex items-center ${
                          selectedCategories.includes(child._id)
                            ? "bg-[#7E3FF2]/80 text-white"
                            : "bg-[#363636] text-zinc-300 hover:bg-[#464646]"
                        }`}
                      >
                        <span className="opacity-70 mr-1">↳</span>{" "}
                        {/* Arrow indicating child */}
                        {child.name.en}
                        {selectedCategories.includes(child._id) && (
                          <span className="ml-1">✓</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <p className="text-center py-10">{t("common.loading")}</p>
        ) : error ? (
          <p className="text-center text-red-500 py-10">{error}</p>
        ) : products && products.length > 0 ? (
          <>
            {filteredProducts.length > 0 ? (
              <>
                <div className="w-full">
                  <table className="w-full table-fixed divide-y divide-[#363636]">
                    <thead className="bg-[#262626]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider w-[25%]">
                          {t("products.name")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider w-[18%]">
                          {t("products.sku")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider w-[12%]">
                          {t("products.barcode")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider w-[10%]">
                          {t("products.category")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider w-[10%]">
                          {t("products.price")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider w-[12%]">
                          {t("products.quantity")}
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-zinc-300 uppercase tracking-wider w-[13%]">
                          {t("common.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#1A1A1A] divide-y divide-[#363636]">
                      {currentProducts.map((product) => (
                        <tr key={product._id} className="hover:bg-[#222222]">
                          <td className="px-4 py-4 overflow-hidden">
                            <div className="flex items-center">
                              <div className="max-w-full">
                                <div className="text-sm font-medium text-white break-words">
                                  {product.name.en}
                                </div>
                                <div className="text-xs text-zinc-400 break-words">
                                  {product.name.ku}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-white break-words">
                            {product.sku}
                          </td>
                          <td className="px-4 py-4 text-sm text-white truncate">
                            {product.barcode || "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-white">
                            {product.category &&
                            typeof product.category === "object" ? (
                              <div className="max-w-full">
                                <div className="text-sm text-white truncate">
                                  {product.category.name?.en || "-"}
                                </div>
                                <div className="text-xs text-zinc-400 truncate">
                                  {product.category.name?.ku || ""}
                                </div>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-[#36F2A3] font-medium">
                              ${product.price.toFixed(2)}
                            </div>
                            <div className="text-xs text-zinc-400">
                              {t("products.cost")}: ${product.cost.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                product.quantity <= 0
                                  ? "bg-[#F23557]/10 text-[#F23557]"
                                  : product.quantity <= product.reorderLevel
                                  ? "bg-[#F2B705]/10 text-[#F2B705]"
                                  : "bg-[#36F2A3]/10 text-[#36F2A3]"
                              }`}
                            >
                              {product.quantity <= 0
                                ? t("products.outOfStock")
                                : product.quantity <= product.reorderLevel
                                ? t("products.lowStock")
                                : t("products.inStock")}
                            </span>
                            <div className="text-xs text-zinc-400 mt-1">
                              {product.quantity} {t("products.units")}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-white text-center">
                            <div className="flex justify-center space-x-3">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/inventory/products/edit/${product._id}`
                                  )
                                }
                                className="text-[#3D9CF2] hover:text-[#7E3FF2]"
                                title={t("common.edit") || "Edit"}
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
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => confirmDelete(product)}
                                className="text-[#F23557] hover:text-[#FF5A77]"
                                title={t("common.delete") || "Delete"}
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
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6 px-6 py-4 bg-[#262626] border-t border-[#363636]">
                    <div className="text-sm text-zinc-400">
                      {t("common.showing") || "Showing"}{" "}
                      <span className="font-medium text-white">
                        {indexOfFirstProduct + 1}
                      </span>{" "}
                      {t("common.to") || "to"}{" "}
                      <span className="font-medium text-white">
                        {Math.min(indexOfLastProduct, filteredProducts.length)}
                      </span>{" "}
                      {t("common.of") || "of"}{" "}
                      <span className="font-medium text-white">
                        {filteredProducts.length}
                      </span>{" "}
                      {t("products.products")}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => paginate(1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === 1
                            ? "bg-[#1A1A1A] text-zinc-500 cursor-not-allowed"
                            : "bg-[#363636] text-white hover:bg-[#4A4A4A]"
                        }`}
                      >
                        &laquo;
                      </button>
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === 1
                            ? "bg-[#1A1A1A] text-zinc-500 cursor-not-allowed"
                            : "bg-[#363636] text-white hover:bg-[#4A4A4A]"
                        }`}
                      >
                        &lsaquo;
                      </button>

                      {/* Page numbers */}
                      {[...Array(totalPages).keys()].map((number) => {
                        // Show current page, 2 before and 2 after
                        const pageNumber = number + 1;
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 2 &&
                            pageNumber <= currentPage + 2)
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => paginate(pageNumber)}
                              className={`px-3 py-1 rounded-md ${
                                currentPage === pageNumber
                                  ? "bg-[#7E3FF2] text-white"
                                  : "bg-[#363636] text-white hover:bg-[#4A4A4A]"
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        } else if (
                          pageNumber === currentPage - 3 ||
                          pageNumber === currentPage + 3
                        ) {
                          return (
                            <span
                              key={pageNumber}
                              className="px-3 py-1 text-zinc-500"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}

                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === totalPages
                            ? "bg-[#1A1A1A] text-zinc-500 cursor-not-allowed"
                            : "bg-[#363636] text-white hover:bg-[#4A4A4A]"
                        }`}
                      >
                        &rsaquo;
                      </button>
                      <button
                        onClick={() => paginate(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === totalPages
                            ? "bg-[#1A1A1A] text-zinc-500 cursor-not-allowed"
                            : "bg-[#363636] text-white hover:bg-[#4A4A4A]"
                        }`}
                      >
                        &raquo;
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-zinc-400 mb-4">
                  {t("products.noMatchingProducts") ||
                    "No products match your search"}
                </p>
                <div className="flex justify-center space-x-4">
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="px-4 py-2 rounded-md bg-[#262626] border border-[#363636] text-white hover:bg-[#363636]"
                    >
                      {t("common.clearSearch") || "Clear Search"}
                    </button>
                  )}
                  {selectedCategories.length > 0 && (
                    <button
                      onClick={clearCategoryFilters}
                      className="px-4 py-2 rounded-md bg-[#262626] border border-[#363636] text-white hover:bg-[#363636]"
                    >
                      {t("common.clearCategories") || "Clear Categories"}
                    </button>
                  )}
                  {(searchTerm || selectedCategories.length > 0) && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        clearCategoryFilters();
                      }}
                      className="px-4 py-2 rounded-md bg-[#363636] border border-[#464646] text-white hover:bg-[#464646]"
                    >
                      {t("common.clearAll") || "Clear All Filters"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-zinc-400 mb-4">
              {t("products.noProductsFound")}
            </p>
            <button
              onClick={() => navigate("/inventory/products/add")}
              className="px-4 py-2 rounded-md bg-gradient-to-r from-[#7E3FF2] to-[#3D9CF2] text-white inline-flex items-center gap-2"
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
                <path d="M12 5v14M5 12h14" />
              </svg>
              {t("products.addFirst")}
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-[#000000] bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => !deleteSuccess && setShowDeleteModal(false)}
            ></div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-[#1A1A1A] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-[#1A1A1A] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  {!deleteSuccess ? (
                    <>
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-[#F23557]/10 sm:mx-0 sm:h-10 sm:w-10">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-[#F23557]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12" y2="17" />
                        </svg>
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-white">
                          {t("products.deleteConfirmation") || "Delete Product"}
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-zinc-400">
                            {t("products.deleteWarning") ||
                              "Are you sure you want to delete this product? This action cannot be undone."}
                          </p>
                          {productToDelete && (
                            <div className="mt-2 p-2 bg-[#262626] rounded-md">
                              <p className="text-sm text-white font-medium">
                                {productToDelete.name.en}
                              </p>
                              <p className="text-xs text-zinc-400">
                                SKU: {productToDelete.sku}
                              </p>
                            </div>
                          )}
                          {deleteError && (
                            <p className="mt-2 text-sm text-[#F23557]">
                              {deleteError}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full text-center py-4">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-[#36F2A3]/10 mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-[#36F2A3]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      </div>
                      <p className="text-[#36F2A3] text-lg font-medium">
                        {t("products.deleteSuccess") ||
                          "Product deleted successfully"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {!deleteSuccess && (
                <div className="bg-[#262626] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#F23557] text-base font-medium text-white hover:bg-[#FF5A77] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F23557] sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleDeleteProduct}
                  >
                    {t("common.delete") || "Delete"}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-[#363636] shadow-sm px-4 py-2 bg-[#262626] text-base font-medium text-white hover:bg-[#363636] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#363636] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    {t("common.cancel") || "Cancel"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
