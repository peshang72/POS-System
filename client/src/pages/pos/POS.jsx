import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ShoppingCart,
  Tag,
  Package,
  Gamepad2,
  Monitor,
  Cpu,
  Headphones,
  X,
  PlusCircle,
  MinusCircle,
  Trash2,
  CreditCard,
  BadgeDollarSign,
  Wallet,
  CheckCircle2,
  PercentCircle,
  DollarSign,
  Settings,
  RefreshCw,
  Coins,
} from "lucide-react";
import { useProducts } from "../../hooks/useProducts";
import { useCategories } from "../../hooks/useCategories";
import { useCustomers } from "../../hooks/useCustomers";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import CustomerSelectionModal from "../../components/pos/CustomerSelectionModal";
import ReceiptPreview from "../../components/pos/ReceiptPreview";
import LoyaltyPointsRedemption from "../../components/pos/LoyaltyPointsRedemption";
import axios from "axios";

// Notification toast component
const NotificationToast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div
        className={`rounded-md shadow-lg p-4 ${
          type === "success" ? "bg-green-600" : "bg-red-600"
        } text-white flex items-start gap-3 max-w-md`}
      >
        <div className="flex-shrink-0 pt-0.5">
          {type === "success" ? <CheckCircle2 size={20} /> : <X size={20} />}
        </div>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white ml-3 hover:bg-white hover:bg-opacity-20 p-1 rounded-full"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

const POS = () => {
  const { t } = useTranslation();
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState("percent"); // 'percent' or 'amount'
  const [discountInputText, setDiscountInputText] = useState(""); // String-based input value
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currency, setCurrency] = useState("USD"); // USD or IQD

  // Customer and transaction state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);

  // Notification state
  const [notification, setNotification] = useState(null);

  // Exchange rate from settings
  const { exchangeRate } = useExchangeRate();

  // Customer hook
  const {
    customers,
    isLoading: isLoadingCustomers,
    error: customerError,
    fetchCustomers,
    addCustomer,
  } = useCustomers();

  // Barcode scanner detection variables
  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(0);
  const BARCODE_SCAN_TIMEOUT = 50; // ms between keystrokes to consider it a scanner

  // Capture keyboard input for barcode scanning
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only process if not typing in an input
      const tagName = document.activeElement.tagName.toLowerCase();
      const isInput = tagName === "input" || tagName === "textarea";

      const currentTime = new Date().getTime();

      // If key is Enter, process the barcode
      if (e.key === "Enter" && barcodeBuffer.current) {
        e.preventDefault();
        const barcode = barcodeBuffer.current;
        barcodeBuffer.current = "";

        // Find product with matching barcode
        const product = products.find((p) => p.barcode === barcode);
        if (product) {
          // Check if product is already in cart
          const existingItem = cart.find((item) => item._id === product._id);

          if (existingItem) {
            // Product already in cart, increment quantity
            setCart(
              cart.map((item) =>
                item._id === product._id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              )
            );
          } else {
            // Product not in cart, add it
            setCart([...cart, { ...product, quantity: 1 }]);
          }
        }
        return;
      }

      // If it's been too long since the last keystroke, reset the buffer
      if (
        currentTime - lastKeyTime.current > BARCODE_SCAN_TIMEOUT &&
        !isInput
      ) {
        barcodeBuffer.current = "";
      }

      // Add character to buffer if it's part of a barcode scan or reset if typing in an input
      if (!isInput && e.key.length === 1) {
        barcodeBuffer.current += e.key;
        lastKeyTime.current = currentTime;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [products, cart]); // Re-attach when products or cart change

  // Fetch categories and products
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch categories
        const categoryResponse = await axios.get("/api/categories");

        // Add the "All" category
        const allCategories = [
          { _id: "all", name: { en: "All" }, icon: Package },
          ...categoryResponse.data.map((category) => {
            // Assign an icon based on category name or default to Package
            let icon = Package;
            const categoryName = category.name.en.toLowerCase();
            if (categoryName.includes("console")) icon = Gamepad2;
            else if (categoryName.includes("accessor")) icon = Headphones;
            else if (categoryName.includes("monitor")) icon = Monitor;
            else if (categoryName.includes("component")) icon = Cpu;

            return { ...category, icon };
          }),
        ];

        setCategories(allCategories);

        // Fetch products with active=true
        const productResponse = await axios.get("/api/products", {
          params: { active: "true" },
        });

        setProducts(productResponse.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch data");
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products by category and search query
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "all" ||
      (product.category && product.category._id === activeCategory);

    const matchesSearch =
      product.name?.en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.name?.ku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Add product to cart
  const addToCart = (product) => {
    const existingItem = cart.find((item) => item._id === product._id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // Remove product from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item._id !== productId));
  };

  // Increase product quantity in cart
  const increaseQuantity = (productId) => {
    setCart(
      cart.map((item) =>
        item._id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  // Decrease product quantity in cart
  const decreaseQuantity = (productId) => {
    setCart(
      cart
        .map((item) =>
          item._id === productId && item.quantity > 1
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Calculate cart total
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Calculate final total with discount
  const subtotal = cartTotal;
  const calculatedDiscount =
    discountType === "percent"
      ? discountPercent > 0
        ? subtotal * (discountPercent / 100)
        : 0
      : Math.min(discountAmount, subtotal); // Ensure discount doesn't exceed subtotal
  const finalTotal = subtotal - calculatedDiscount;

  // Inside the POS component
  const [showLoyaltyRedemption, setShowLoyaltyRedemption] = useState(false);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);

  // Show a startup notification that cash payments are now implemented
  useEffect(() => {
    if (!isLoading) {
      setNotification({
        type: "success",
        message: t(
          "pos.cashPaymentEnabled",
          "Cash payment is now enabled! Complete a sale to update inventory quantities."
        ),
      });
    }
  }, [isLoading, t]);

  // Handle loyalty points redemption
  const handleLoyaltyRedemption = (redemptionData) => {
    if (redemptionData && redemptionData.monetaryValue) {
      setLoyaltyDiscount(redemptionData.monetaryValue);
    }
    setShowLoyaltyRedemption(false);
  };

  // Updated prepareTransactionData to include loyalty redemption and productSnapshot
  const prepareTransactionData = () => {
    if (cart.length === 0) return null;

    // Calculate totals
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate discount amount
    let calculatedDiscount = 0;
    if (discountType === "percent") {
      calculatedDiscount = (subtotal * discountPercent) / 100;
    } else {
      calculatedDiscount = discountAmount;
    }

    // Calculate final total
    const finalTotal = subtotal - calculatedDiscount - loyaltyDiscount;

    // Map discount type to backend format
    const mappedDiscountType =
      discountType === "percent" ? "percentage" : "fixed";

    // Generate a temporary invoice number (server will replace this)
    const tempInvoiceNumber = `INV-${Date.now()}`;

    return {
      // Don't set _id - MongoDB will generate this
      customer: selectedCustomer?._id, // May be null for guest transactions
      items: cart.map((item) => ({
        product: item._id,
        productSnapshot: {
          name: item.name,
          sku: item.sku,
          price: item.price,
        },
        quantity: item.quantity,
        unitPrice: item.price, // Add required unitPrice field
        subtotal: item.price * item.quantity, // Add required subtotal field
        discount: 0, // Add default discount field
        discountType: "fixed", // Add default discountType field
      })),
      subtotal,
      discountType: mappedDiscountType,
      discountValue:
        discountType === "percent" ? discountPercent : discountAmount,
      discountAmount: calculatedDiscount,
      loyaltyDiscount: loyaltyDiscount,
      total: finalTotal,
      currency,
      exchangeRate: currency === "IQD" ? exchangeRate : 1,
      paymentMethod: "cash", // Default to cash payment
      paymentDetails: {}, // Will be filled in during checkout
      register: localStorage.getItem("register") || "main", // Default register ID
      invoiceNumber: tempInvoiceNumber, // Add required invoiceNumber field
      createdAt: new Date(),
    };
  };

  // Handle confirming the transaction from the receipt preview
  const handleConfirmTransaction = async (paymentDetails) => {
    console.log("handleConfirmTransaction called with:", paymentDetails);
    await saveTransaction(paymentDetails);
  };

  // Save transaction to server
  const saveTransaction = async (paymentData = {}) => {
    console.log("saveTransaction called with:", paymentData);

    if (!pendingTransaction) {
      console.error("No pending transaction found");
      return;
    }

    setIsSavingTransaction(true);

    try {
      // Ensure discountType is valid for backend (only "percentage" or "fixed" allowed)
      const cleanedPendingTransaction = {
        ...pendingTransaction,
      };

      // Make sure we're always sending the correct discount type value to backend
      if (
        cleanedPendingTransaction.discountType === "amount" ||
        cleanedPendingTransaction.discountType === "percent"
      ) {
        cleanedPendingTransaction.discountType =
          cleanedPendingTransaction.discountType === "percent"
            ? "percentage"
            : "fixed";
      }

      // Update transaction with payment details
      const transactionData = {
        ...cleanedPendingTransaction,
        paymentDetails: paymentData,
        paymentStatus: "paid", // Default status for cash payments
      };

      console.log("Sending transaction data to server:", transactionData);

      // Send to server
      const response = await axios.post("/api/transactions", transactionData);
      console.log("Server response:", response.data);

      // Save the transaction response for receipt
      setTransaction(response.data);
      setPendingTransaction(null);

      // Show success notification
      setNotification({
        type: "success",
        message: t(
          "pos.transactionSuccess",
          "Sale completed successfully! Products have been updated in inventory."
        ),
      });
    } catch (err) {
      console.error("Error saving transaction details:", err);

      // Extract detailed validation errors if available
      const errorDetails =
        err.response?.data?.errors || err.response?.data?.error || err.message;
      console.error("Validation errors:", errorDetails);

      let errorMessage = t("pos.transactionError", "Failed to complete sale.");

      if (typeof errorDetails === "object") {
        // If we have structured validation errors, show the first one
        const firstError =
          Object.values(errorDetails)[0]?.message ||
          JSON.stringify(errorDetails);
        errorMessage = `Validation error: ${firstError}`;
      } else if (typeof errorDetails === "string") {
        errorMessage = errorDetails;
      }

      setError(errorMessage);

      // Show error notification
      setNotification({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsSavingTransaction(false);
    }
  };

  // Reset function to clear cart and discount values
  const resetCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setDiscountAmount(0);
    setDiscountInputText("");
    setLoyaltyDiscount(0);
    setSelectedCustomer(null);
    setTransaction(null);
    setPendingTransaction(null);
    setShowReceiptPreview(false);
    setShowLoyaltyRedemption(false);
  };

  // Handle the checkout button click
  const handleCheckout = () => {
    if (cart.length > 0) {
      // Open customer selection modal
      setShowCustomerModal(true);
    }
  };

  // Handle customer selection and proceed to checkout
  const handleCustomerSelect = (customer = null) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);

    // Prepare transaction data and show preview
    const preparedTransaction = prepareTransactionData();
    console.log("Setting pendingTransaction:", preparedTransaction);
    setPendingTransaction(preparedTransaction);
    setShowReceiptPreview(true);
  };

  // Handle adding a new customer
  const handleAddNewCustomer = () => {
    // This would normally open a form to add a new customer
    alert("Add customer feature will be implemented soon!");
  };

  // Handle closing receipt and starting new sale
  const handleNewSale = () => {
    setShowReceiptPreview(false);
    resetCart();
  };

  // Handle canceling the transaction
  const handleCancelTransaction = () => {
    setShowReceiptPreview(false);
    setPendingTransaction(null);
    // Keep the cart and customer selection
  };

  // Helper function to format price based on currency
  const formatPrice = (priceUSD) => {
    if (currency === "USD") {
      return `$${priceUSD.toFixed(2)}`;
    } else {
      const priceIQD = priceUSD * exchangeRate;
      return `${priceIQD.toLocaleString()} IQD`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-7rem)] items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[calc(100vh-7rem)] items-center justify-center text-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <h1 className="text-2xl font-bold mb-4">{t("navigation.pos")}</h1>

      {/* Notification Toast */}
      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex flex-row gap-6 h-full">
        {/* Products Section */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Search Bar and Currency Toggle */}
          <div className="mb-4 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t("pos.searchProducts")}
                className="input flex-1 bg-secondary-bg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div className="flex-shrink-0">
                <div className="flex rounded-md overflow-hidden shadow-lg">
                  <button
                    className={`px-4 py-2 flex items-center gap-1.5 transition-colors ${
                      currency === "USD"
                        ? "bg-accent text-white font-medium"
                        : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                    }`}
                    onClick={() => setCurrency("USD")}
                  >
                    <DollarSign size={16} />
                    <span>USD</span>
                  </button>
                  <button
                    className={`px-4 py-2 flex items-center gap-1.5 transition-colors ${
                      currency === "IQD"
                        ? "bg-accent text-white font-medium"
                        : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                    }`}
                    onClick={() => setCurrency("IQD")}
                  >
                    <span>IQD</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex overflow-x-auto pb-2 mb-4 gap-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => (
              <button
                key={category._id}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full transition-colors 
                  ${
                    activeCategory === category._id
                      ? "bg-accent text-white shadow-lg shadow-accent/40"
                      : "bg-secondary-bg text-gray-300 hover:bg-gray-700"
                  }`}
                onClick={() => setActiveCategory(category._id)}
              >
                <category.icon size={18} />
                <span>{category.name.en}</span>
              </button>
            ))}
          </div>

          {/* Products Grid - Fixed with proper overflow handling */}
          <div className="overflow-y-auto flex-1 pb-4 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-0.5">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-400">
                  No products found
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="bg-secondary-bg rounded-lg overflow-visible group relative"
                  >
                    <div
                      className="relative cursor-pointer transition-all duration-300 rounded-lg shadow-sm hover:shadow-lg hover:shadow-accent/40"
                      onClick={() => addToCart(product)}
                    >
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name.en}
                          className="w-full h-40 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-40 flex items-center justify-center bg-gray-800 rounded-t-lg">
                          <Package size={48} className="text-gray-600" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-secondary-bg rounded-full px-2 py-1 text-xs flex items-center gap-1">
                        <Tag size={12} className="text-accent" />
                        <span>{formatPrice(product.price)}</span>
                      </div>
                      {product.discount > 0 && (
                        <div className="absolute top-2 left-2 bg-success bg-opacity-80 rounded-full px-2 py-1 text-xs text-white flex items-center gap-1">
                          <PercentCircle size={12} />
                          <span>{product.discount}% OFF</span>
                        </div>
                      )}
                      <div className="p-3">
                        <div className="overflow-x-auto whitespace-nowrap pb-1 mb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                          <h3 className="font-medium">{product.name.en}</h3>
                        </div>

                        <div className="mt-1 space-y-1">
                          {product.sku && (
                            <div className="flex items-center text-xs text-gray-400">
                              <span className="mr-1">SKU:</span>
                              <span className="font-mono">{product.sku}</span>
                            </div>
                          )}

                          {product.barcode && (
                            <div className="flex items-center text-xs text-gray-400">
                              <span className="mr-1">Barcode:</span>
                              <span className="font-mono">
                                {product.barcode}
                              </span>
                            </div>
                          )}

                          {product.category && (
                            <div className="flex items-center text-xs text-gray-400">
                              <span className="mr-1">Category:</span>
                              <span>{product.category.name?.en}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center mt-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              product.quantity > 10
                                ? "bg-success bg-opacity-20 text-success"
                                : product.quantity > 5
                                ? "bg-warning bg-opacity-20 text-warning"
                                : "bg-error bg-opacity-20 text-error"
                            }`}
                          >
                            Stock: {product.quantity}
                          </span>
                          <button
                            className="p-1 rounded-full bg-accent bg-opacity-20 text-accent hover:bg-opacity-40 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product);
                            }}
                          >
                            <PlusCircle size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Cart Section - Fixed width for dual-panel layout */}
        <div className="w-96 flex flex-col h-full bg-secondary-bg rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center">
              <ShoppingCart className="mr-2" size={20} />
              {t("pos.cart")}
            </h2>
            {cart.length > 0 && (
              <button
                className="btn btn-sm btn-error"
                onClick={() => setCart([])}
              >
                {t("pos.clearCart")}
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">
                {t("pos.customer")}:
              </span>
              <button
                className="btn btn-xs btn-ghost"
                onClick={() => setShowCustomerModal(true)}
              >
                {t("pos.change")}
              </button>
            </div>
            <div className="p-2 border border-gray-700 rounded bg-gray-800">
              <p className="font-medium">
                {selectedCustomer
                  ? selectedCustomer.firstName + " " + selectedCustomer.lastName
                  : t("pos.guest")}
              </p>
              {selectedCustomer && (
                <>
                  {selectedCustomer.phone && (
                    <p className="text-sm text-gray-400">
                      {selectedCustomer.phone}
                    </p>
                  )}
                  {selectedCustomer.loyaltyPoints > 0 && (
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-primary flex items-center">
                        <Coins size={14} className="mr-1" />
                        {t("pos.loyalty.points")}:{" "}
                        {selectedCustomer.loyaltyPoints}
                      </p>
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={() => setShowLoyaltyRedemption(true)}
                      >
                        {t("pos.loyalty.redeem")}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Loyalty Points Redemption */}
          {showLoyaltyRedemption && selectedCustomer && (
            <div className="mb-4">
              <LoyaltyPointsRedemption
                customer={selectedCustomer}
                onRedemptionComplete={handleLoyaltyRedemption}
                onClose={() => setShowLoyaltyRedemption(false)}
                currency={currency}
                exchangeRate={exchangeRate}
              />
            </div>
          )}

          {/* Display applied loyalty discount */}
          {loyaltyDiscount > 0 && (
            <div className="mb-4 p-2 border border-primary rounded bg-primary bg-opacity-10">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium flex items-center text-primary">
                  <Coins size={14} className="mr-1" />
                  {t("pos.loyalty.discountApplied")}
                </p>
                <p className="font-medium text-primary">
                  {formatPrice(loyaltyDiscount)}
                </p>
              </div>
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto mb-4 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingCart size={48} className="mb-2 opacity-30" />
                <p>{t("pos.emptyCart")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item._id}
                    className="flex gap-3 border-b border-gray-700 pb-3"
                  >
                    <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden relative bg-gray-800">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.name.en}
                          className="w-full h-full object-cover absolute inset-0"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={24} className="text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="overflow-x-auto whitespace-nowrap pr-2 max-w-[calc(100%-20px)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                          <h3 className="font-medium text-sm">
                            {item.name.en}
                          </h3>
                        </div>
                        <button
                          className="text-gray-400 hover:text-error transition-colors flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item._id);
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <span className="text-accent text-sm">
                        {formatPrice(item.price)}
                      </span>
                      <div className="flex justify-between items-center mt-auto">
                        <div className="flex items-center gap-1 bg-gray-800 rounded-md">
                          <button
                            className="p-1 text-gray-300 hover:text-error transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              decreaseQuantity(item._id);
                            }}
                          >
                            <MinusCircle size={16} />
                          </button>
                          <span className="px-2 text-sm">{item.quantity}</span>
                          <button
                            className="p-1 text-gray-300 hover:text-success transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              increaseQuantity(item._id);
                            }}
                          >
                            <PlusCircle size={16} />
                          </button>
                        </div>
                        <span className="font-medium text-sm">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discounts */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">{t("pos.subtotal")}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            {/* Discount Type Toggle */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">{t("pos.discount")}</span>
              <div className="flex rounded-md overflow-hidden">
                <button
                  className={`px-2 py-1 text-xs flex items-center ${
                    discountType === "percent"
                      ? "bg-accent text-white"
                      : "bg-gray-800 text-gray-400"
                  }`}
                  onClick={() => setDiscountType("percent")}
                >
                  <PercentCircle size={14} className="mr-1" />
                  Percent
                </button>
                <button
                  className={`px-2 py-1 text-xs flex items-center ${
                    discountType === "amount"
                      ? "bg-accent text-white"
                      : "bg-gray-800 text-gray-400"
                  }`}
                  onClick={() => setDiscountType("amount")}
                >
                  <DollarSign size={14} className="mr-1" />
                  Amount
                </button>
              </div>
            </div>

            {/* Discount Input */}
            {discountType === "percent" ? (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center flex-1">
                  <PercentCircle size={16} className="text-accent mr-1" />
                  <span className="text-gray-400 text-sm">Percent Off</span>
                </div>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) =>
                      setDiscountPercent(
                        Math.max(0, Math.min(100, Number(e.target.value)))
                      )
                    }
                    onFocus={(e) => e.target.select()}
                    className="w-16 bg-gray-800 px-2 py-1 rounded text-right mr-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span>%</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center flex-1">
                  <DollarSign size={16} className="text-accent mr-1" />
                  <span className="text-gray-400 text-sm">Fixed Discount</span>
                </div>
                <div className="flex items-center">
                  {currency === "USD" ? (
                    <>
                      <span className="mr-1">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={discountInputText}
                        onChange={(e) => {
                          // Only allow numbers
                          const value = e.target.value.replace(/[^0-9.]/g, "");
                          setDiscountInputText(value);

                          // Convert to number and update discount amount
                          if (value === "") {
                            setDiscountAmount(0);
                          } else {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                              setDiscountAmount(Math.min(subtotal, numValue));
                            }
                          }
                        }}
                        onBlur={() => {
                          // Format the input when leaving the field
                          if (discountAmount > 0) {
                            setDiscountInputText(discountAmount.toString());
                          } else {
                            setDiscountInputText("");
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        className="w-20 bg-gray-800 px-2 py-1 rounded text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={discountInputText}
                        onChange={(e) => {
                          // Only allow numbers
                          const value = e.target.value.replace(/[^0-9.]/g, "");
                          setDiscountInputText(value);

                          // Convert to number and update discount amount
                          if (value === "") {
                            setDiscountAmount(0);
                          } else {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                              // Convert from IQD to USD for internal storage
                              setDiscountAmount(
                                Math.min(subtotal, numValue / exchangeRate)
                              );
                            }
                          }
                        }}
                        onBlur={() => {
                          // Format the input when leaving the field
                          if (discountAmount > 0) {
                            const displayValue = (
                              discountAmount * exchangeRate
                            ).toString();
                            setDiscountInputText(displayValue);
                          } else {
                            setDiscountInputText("");
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        className="w-28 bg-gray-800 px-2 py-1 rounded text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="ml-1">IQD</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {calculatedDiscount > 0 && (
              <div className="flex justify-between mb-2 text-success">
                <span>{t("pos.discountAmount")}</span>
                <span>-{formatPrice(calculatedDiscount)}</span>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="mt-auto">
            {/* Subtotal */}
            <div className="flex justify-between mb-2">
              <span className="font-medium">{t("pos.subtotal")}:</span>
              <span>
                {formatPrice(
                  cart.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                  )
                )}
              </span>
            </div>

            {/* Regular Discount */}
            {(discountAmount > 0 || discountPercent > 0) && (
              <div className="flex justify-between mb-2 text-orange-400">
                <span>
                  {t("pos.discount")}
                  {discountType === "percent" ? ` (${discountPercent}%)` : ""}:
                </span>
                <span>
                  -
                  {formatPrice(
                    discountType === "percent"
                      ? (cart.reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        ) *
                          discountPercent) /
                          100
                      : discountAmount
                  )}
                </span>
              </div>
            )}

            {/* Loyalty Discount */}
            {loyaltyDiscount > 0 && (
              <div className="flex justify-between mb-2 text-primary">
                <span className="flex items-center">
                  <Coins size={14} className="mr-1" />
                  {t("pos.loyalty.discount")}:
                </span>
                <span>-{formatPrice(loyaltyDiscount)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-700">
              <span>{t("pos.total")}:</span>
              <span>
                {formatPrice(
                  Math.max(
                    0,
                    cart.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    ) -
                      (discountType === "percent"
                        ? (cart.reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0
                          ) *
                            discountPercent) /
                          100
                        : discountAmount) -
                      loyaltyDiscount
                  )
                )}
              </span>
            </div>
          </div>

          {/* Payment Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              className="btn btn-secondary flex items-center justify-center gap-2"
              onClick={() =>
                cart.length > 0 &&
                alert("Card payment feature will be implemented soon!")
              }
            >
              <CreditCard size={18} />
              <span>{t("pos.card")}</span>
            </button>
            <button
              className="btn btn-secondary flex items-center justify-center gap-2"
              onClick={() =>
                cart.length > 0 &&
                alert("Cash payment feature will be implemented soon!")
              }
            >
              <BadgeDollarSign size={18} />
              <span>{t("pos.cash")}</span>
            </button>
          </div>
          <button
            className={`btn w-full flex items-center justify-center gap-2 ${
              cart.length === 0
                ? "btn-secondary opacity-50 cursor-not-allowed"
                : "btn-success"
            }`}
            disabled={cart.length === 0 || isSavingTransaction}
            onClick={handleCheckout}
          >
            {isSavingTransaction ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <CheckCircle2 size={18} />
            )}
            <span>{t("pos.checkout")}</span>
          </button>
        </div>
      </div>

      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        customers={customers}
        isLoading={isLoadingCustomers}
        onSelectCustomer={handleCustomerSelect}
        onAddNewCustomer={handleAddNewCustomer}
      />

      {/* Receipt Preview */}
      <ReceiptPreview
        isOpen={showReceiptPreview}
        onClose={handleCancelTransaction}
        onNewSale={handleNewSale}
        transaction={transaction || pendingTransaction}
        cart={cart}
        customer={selectedCustomer}
        subtotal={subtotal}
        discount={calculatedDiscount}
        total={finalTotal}
        discountType={discountType}
        discountValue={
          discountType === "percent" ? discountPercent : discountAmount
        }
        currency={currency}
        exchangeRate={exchangeRate}
        isPending={!transaction && !!pendingTransaction}
        onConfirm={handleConfirmTransaction}
        isSaving={isSavingTransaction}
      />
    </div>
  );
};

export default POS;
