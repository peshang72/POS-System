import {
  X,
  Printer,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Wallet,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

const ReceiptPreview = ({
  isOpen,
  onClose,
  transaction,
  cart,
  customer,
  subtotal,
  discount,
  total,
  discountType,
  discountValue,
  currency,
  exchangeRate,
  onNewSale,
  isPending = false,
  onConfirm = null,
  isSaving = false,
}) => {
  const { t } = useTranslation();
  const [amountTendered, setAmountTendered] = useState("");
  const [changeAmount, setChangeAmount] = useState(0);

  // Reset the cash payment fields when the transaction changes
  useEffect(() => {
    if (transaction) {
      // Set default amountTendered to the total amount
      setAmountTendered(total.toString());
      setChangeAmount(0);
    }
  }, [transaction, total]);

  // Calculate change when amount tendered changes
  useEffect(() => {
    console.log(
      "amountTendered changed:",
      amountTendered,
      typeof amountTendered
    );
    if (amountTendered && !isNaN(amountTendered)) {
      const tendered = parseFloat(amountTendered);
      if (tendered >= total) {
        setChangeAmount(tendered - total);
      } else {
        setChangeAmount(0);
      }
    } else {
      setChangeAmount(0);
    }
  }, [amountTendered, total]);

  if (!isOpen || !transaction) {
    console.log(
      "ReceiptPreview not rendering. isOpen:",
      isOpen,
      "transaction:",
      transaction
    );
    return null;
  }

  console.log("ReceiptPreview rendering with transaction:", transaction);

  // Format date for receipt
  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
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

  // Helper function to get customer name
  const getCustomerName = (customer) => {
    if (!customer) return t("pos.guest", "Guest");
    if (customer.fullName) return customer.fullName;
    if (customer.firstName && customer.lastName)
      return `${customer.firstName} ${customer.lastName}`;
    if (customer.firstName) return customer.firstName;
    if (customer.lastName) return customer.lastName;
    return t("pos.unknownCustomer", "Unknown Customer");
  };

  // Helper function to generate preview invoice number
  const getInvoiceNumber = () => {
    // For completed transactions (from server response), check nested data structure
    if (!isPending && transaction?.data?.invoiceNumber) {
      return transaction.data.invoiceNumber;
    }
    // For pending transactions, use the invoiceNumber directly
    else if (transaction?.invoiceNumber) {
      return transaction.invoiceNumber;
    }
    // Fallback for completed transactions without invoice number
    else if (!isPending && transaction?.data?._id) {
      return transaction.data._id.substring(0, 8).toUpperCase();
    }
    // Fallback for pending transactions without invoice number
    else {
      return "Preview";
    }
  };

  // Handle printing the receipt
  const handlePrint = () => {
    const printContent = generatePrintableReceipt();
    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Generate printable receipt HTML
  const generatePrintableReceipt = () => {
    // Pre-calculate all dynamic values
    const invoiceNumber = getInvoiceNumber();
    const receiptDate = formatDate(transaction.createdAt || new Date());
    const customerName = getCustomerName(customer);
    const storeName = t("store.name", "Lîstik Store");
    const storeAddress = t("store.address", "123 Your Street, City");
    const storePhone = t("store.phone", "Tel: (123) 456-7890");
    const receiptLabel = t("pos.receiptNumber", "Receipt #");
    const dateLabel = t("pos.date", "Date");
    const customerLabel = t("pos.customer", "Customer");
    const phoneLabel = t("pos.phone", "Phone");
    const itemLabel = t("pos.item", "Item");
    const totalLabel = t("pos.total", "Total");
    const subtotalLabel = t("pos.subtotal", "Subtotal");
    const discountLabel = t("pos.discount", "Discount");
    const loyaltyDiscountLabel = t("pos.loyalty.discount", "Loyalty Discount");
    const finalTotalLabel = t("pos.total", "TOTAL");
    const paymentMethodLabel = t("pos.paymentMethod", "Payment Method");
    const cashLabel = t("pos.paymentMethods.cash", "Cash");
    const amountTenderedLabel = t("pos.amountTendered", "Amount Tendered");
    const changeLabel = t("pos.change", "Change");
    const pointsEarnedLabel = t("pos.loyalty.pointsEarned", "Points Earned");
    const newBalanceLabel = t("pos.loyalty.newBalance", "New Points Balance");
    const pointsRedeemedLabel = t(
      "pos.loyalty.pointsRedeemed",
      "Points Redeemed"
    );
    const thankYouMessage = t("pos.thankYou", "Thank you for your purchase!");

    // Generate items HTML
    const itemsHTML = cart
      .map((item) => {
        const itemPrice =
          currency === "USD"
            ? `$${item.price.toFixed(2)}`
            : `${(item.price * exchangeRate).toLocaleString()} IQD`;
        const itemTotal =
          currency === "USD"
            ? `$${(item.price * item.quantity).toFixed(2)}`
            : `${(
                item.price *
                item.quantity *
                exchangeRate
              ).toLocaleString()} IQD`;

        return `
        <div class="item-row">
          <div class="item-name">${item.name.en}</div>
          <div class="item-details">
            <span>${item.quantity} x ${itemPrice}</span>
            <span>${itemTotal}</span>
          </div>
        </div>`;
      })
      .join("");

    // Generate discount HTML
    const discountHTML =
      discount > 0
        ? `
      <div class="total-row">
        <span>${discountLabel}${
            discountType === "percent" ? ` (${discountValue}%)` : ""
          }:</span>
        <span>-${formatPrice(discount)}</span>
      </div>`
        : "";

    // Generate loyalty discount HTML
    const loyaltyDiscountHTML =
      transaction.loyaltyDiscount > 0
        ? `
      <div class="total-row">
        <span>${loyaltyDiscountLabel}:</span>
        <span>-${formatPrice(transaction.loyaltyDiscount)}</span>
      </div>`
        : "";

    // Generate payment details HTML
    const paymentDetailsHTML =
      !isPending && transaction.paymentDetails
        ? `
      <div class="payment-details">
        <div class="total-row">
          <span>${paymentMethodLabel}:</span>
          <span>${cashLabel}</span>
        </div>
        ${
          transaction.paymentDetails.amountTendered
            ? `
        <div class="total-row">
          <span>${amountTenderedLabel}:</span>
          <span>${formatPrice(transaction.paymentDetails.amountTendered)}</span>
        </div>`
            : ""
        }
        ${
          transaction.paymentDetails.change
            ? `
        <div class="total-row">
          <span>${changeLabel}:</span>
          <span>${formatPrice(transaction.paymentDetails.change)}</span>
        </div>`
            : ""
        }
      </div>`
        : "";

    // Generate loyalty section HTML
    const loyaltyHTML =
      (transaction.loyaltyPointsAwarded > 0 ||
        transaction.loyaltyDiscount > 0) &&
      customer
        ? `
      <div class="loyalty-section">
        ${
          transaction.loyaltyPointsAwarded > 0
            ? `
        <div class="total-row">
          <span>${pointsEarnedLabel}:</span>
          <span>+${transaction.loyaltyPointsAwarded}</span>
        </div>
        <div class="total-row">
          <span>${newBalanceLabel}:</span>
          <span>${
            customer.loyaltyPoints + (transaction.loyaltyPointsAwarded || 0)
          }</span>
        </div>`
            : ""
        }
        ${
          transaction.loyaltyDiscount > 0
            ? `
        <div class="total-row">
          <span>${pointsRedeemedLabel}:</span>
          <span>${
            transaction.loyaltyPointsRedeemed ||
            Math.round(transaction.loyaltyDiscount / 0.01)
          }</span>
        </div>`
            : ""
        }
      </div>`
        : "";

    // Generate phone number HTML
    const phoneHTML = customer?.phone
      ? `
      <div class="info-row">
        <span>${phoneLabel}:</span>
        <span>${customer.phone}</span>
      </div>`
      : "";

    return `<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      background: white;
      width: 58mm;
      margin: 0 auto;
      padding: 5mm;
    }
    .receipt-header {
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 1px dashed #000;
      padding-bottom: 10px;
    }
    .store-name {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .store-info {
      font-size: 10px;
      line-height: 1.2;
    }
    .receipt-info {
      margin: 10px 0;
      border-bottom: 1px dashed #000;
      padding-bottom: 10px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .items-table {
      width: 100%;
      margin: 10px 0;
    }
    .items-header {
      border-bottom: 1px solid #000;
      padding-bottom: 3px;
      margin-bottom: 5px;
      font-weight: bold;
    }
    .item-row {
      margin-bottom: 3px;
      border-bottom: 1px dotted #ccc;
      padding-bottom: 3px;
    }
    .item-name {
      font-weight: bold;
    }
    .item-details {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }
    .totals {
      border-top: 1px dashed #000;
      padding-top: 10px;
      margin-top: 10px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    .total-final {
      font-weight: bold;
      font-size: 14px;
      border-top: 1px solid #000;
      padding-top: 5px;
      margin-top: 5px;
    }
    .payment-details {
      border-top: 1px dashed #000;
      padding-top: 10px;
      margin-top: 10px;
    }
    .loyalty-section {
      border-top: 1px dashed #000;
      padding-top: 10px;
      margin-top: 10px;
    }
    .footer {
      text-align: center;
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px dashed #000;
      font-size: 10px;
    }
    @media print {
      body {
        width: auto;
        margin: 0;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-header">
    <div class="store-name">${storeName}</div>
    <div class="store-info">
      ${storeAddress}<br>
      ${storePhone}
    </div>
  </div>

  <div class="receipt-info">
    <div class="info-row">
      <span>${receiptLabel}:</span>
      <span>${invoiceNumber}</span>
    </div>
    <div class="info-row">
      <span>${dateLabel}:</span>
      <span>${receiptDate}</span>
    </div>
    <div class="info-row">
      <span>${customerLabel}:</span>
      <span>${customerName}</span>
    </div>
    ${phoneHTML}
  </div>

  <div class="items-table">
    <div class="items-header">
      <div style="display: flex; justify-content: space-between;">
        <span>${itemLabel}</span>
        <span>${totalLabel}</span>
      </div>
    </div>
    ${itemsHTML}
  </div>

  <div class="totals">
    <div class="total-row">
      <span>${subtotalLabel}:</span>
      <span>${formatPrice(subtotal)}</span>
    </div>
    ${discountHTML}
    ${loyaltyDiscountHTML}
    <div class="total-row total-final">
      <span>${finalTotalLabel}:</span>
      <span>${formatPrice(total)}</span>
    </div>
  </div>

  ${paymentDetailsHTML}
  ${loyaltyHTML}

  <div class="footer">
    ${thankYouMessage}
  </div>
</body>
</html>`;
  };

  // Handle confirming the sale with payment details
  const handleConfirmSale = () => {
    console.log("Confirm Sale button clicked");
    // Add payment details to the transaction
    const paymentDetails = {
      amountTendered: parseFloat(amountTendered),
      change: changeAmount,
    };
    console.log("Payment details prepared:", paymentDetails);

    if (typeof onConfirm !== "function") {
      console.error("onConfirm is not a function", onConfirm);
      return;
    }

    console.log("Calling onConfirm function");
    onConfirm(paymentDetails);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white text-black rounded-lg w-[400px] max-w-[90vw] max-h-[80vh] flex flex-col">
        <div className="p-4 bg-gray-100 border-b border-gray-300 flex justify-between items-center rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {isPending ? (
              <>
                <AlertCircle size={20} className="text-amber-500" />
                <span>{t("pos.receiptPreview", "Receipt Preview")}</span>
              </>
            ) : (
              <span>{t("pos.receiptPreview", "Receipt Preview")}</span>
            )}
          </h2>
          <div className="flex gap-2">
            {!isPending && (
              <button
                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1"
                onClick={handlePrint}
              >
                <Printer size={16} />
                <span>{t("pos.print", "Print")}</span>
              </button>
            )}
            <button
              className="p-2 hover:bg-gray-200 rounded-md"
              onClick={onClose}
              disabled={isSaving}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold">
              {t("store.name", "Lîstik Store")}
            </h1>
            <p className="text-gray-600">
              {t("store.address", "123 Your Street, City")}
            </p>
            <p className="text-gray-600">
              {t("store.phone", "Tel: (123) 456-7890")}
            </p>
          </div>

          {isPending && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md mb-4 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>
                {t(
                  "pos.previewNotice",
                  "This is a preview. Confirm the sale to complete the transaction."
                )}
              </span>
            </div>
          )}

          <div className="border-t border-b border-gray-300 py-3 mb-3">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {t("pos.receiptNumber", "Receipt #")}:
              </span>
              <span>
                {getInvoiceNumber()}
                {isPending && (
                  <span className="text-xs text-amber-600 ml-2">
                    ({t("pos.preview", "Preview")})
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t("pos.date", "Date")}:</span>
              <span>{formatDate(transaction.createdAt || new Date())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                {t("pos.customer", "Customer")}:
              </span>
              <span>{getCustomerName(customer)}</span>
            </div>
            {customer?.phone && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {t("pos.phone", "Phone")}:
                </span>
                <span>{customer.phone}</span>
              </div>
            )}
          </div>

          <table className="w-full mb-4">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2">{t("pos.item", "Item")}</th>
                <th className="text-center py-2">{t("pos.qty", "Qty")}</th>
                <th className="text-right py-2">{t("pos.price", "Price")}</th>
                <th className="text-right py-2">{t("pos.total", "Total")}</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item._id} className="border-b border-gray-200">
                  <td className="py-2 text-sm">{item.name.en}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">
                    {currency === "USD"
                      ? `$${item.price.toFixed(2)}`
                      : `${(item.price * exchangeRate).toLocaleString()} IQD`}
                  </td>
                  <td className="py-2 text-right">
                    {currency === "USD"
                      ? `$${(item.price * item.quantity).toFixed(2)}`
                      : `${(
                          item.price *
                          item.quantity *
                          exchangeRate
                        ).toLocaleString()} IQD`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 border-b border-gray-300 pb-3 mb-3">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {t("pos.subtotal", "Subtotal")}:
              </span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-gray-800">
                <span>
                  {t("pos.discount", "Discount")}
                  {discountType === "percent" ? ` (${discountValue}%)` : ""}:
                </span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}

            {/* Show loyalty discount if applicable */}
            {transaction.loyaltyDiscount > 0 && (
              <div className="flex justify-between text-gray-800">
                <span className="flex items-center">
                  {t("pos.loyalty.discount", "Loyalty Discount")}:
                </span>
                <span>-{formatPrice(transaction.loyaltyDiscount)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between font-bold text-lg">
            <span>{t("pos.total", "TOTAL")}:</span>
            <span>{formatPrice(total)}</span>
          </div>

          {/* Cash payment section */}
          {isPending && (
            <div className="mt-4 pt-4 border-t border-gray-300">
              <h3 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Wallet size={18} />
                {t("pos.paymentMethod", "Payment Method")}
              </h3>

              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign size={18} className="text-green-600" />
                  <span className="font-medium">
                    {t("pos.paymentMethods.cash", "Cash")}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      {t("pos.amountTendered", "Amount Tendered")}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {currency === "USD" ? "$" : "IQD"}
                      </span>
                      <input
                        type="number"
                        className="input w-full pl-8 bg-white border border-gray-300"
                        value={amountTendered}
                        onChange={(e) => {
                          console.log("Input changed:", e.target.value);
                          setAmountTendered(e.target.value);
                        }}
                        min={total}
                        step="0.01"
                        placeholder={formatPrice(total).replace(/[^0-9.]/g, "")}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      {t("pos.change", "Change")}
                    </label>
                    <div className="p-2 bg-gray-200 rounded text-right font-medium">
                      {formatPrice(changeAmount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment details if not pending */}
          {!isPending && transaction.paymentDetails && (
            <div className="mt-4 pt-4 border-t border-gray-300">
              <h3 className="font-medium text-gray-800 mb-2">
                {t("pos.paymentDetails", "Payment Details")}
              </h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("pos.paymentMethod", "Payment Method")}:
                  </span>
                  <span className="font-medium">
                    {t("pos.paymentMethods.cash", "Cash")}
                  </span>
                </div>
                {transaction.paymentDetails.amountTendered && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("pos.amountTendered", "Amount Tendered")}:
                    </span>
                    <span>
                      {formatPrice(transaction.paymentDetails.amountTendered)}
                    </span>
                  </div>
                )}
                {transaction.paymentDetails.change && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("pos.change", "Change")}:
                    </span>
                    <span>
                      {formatPrice(transaction.paymentDetails.change)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loyalty points earned section */}
          {transaction.loyaltyPointsAwarded > 0 && customer && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="flex justify-between text-gray-800">
                <span>{t("pos.loyalty.pointsEarned", "Points Earned")}:</span>
                <span className="font-medium">
                  +{transaction.loyaltyPointsAwarded}
                </span>
              </div>
              <div className="flex justify-between text-gray-800">
                <span>
                  {t("pos.loyalty.newBalance", "New Points Balance")}:
                </span>
                <span className="font-medium">
                  {customer.loyaltyPoints +
                    (transaction.loyaltyPointsAwarded || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Loyalty points redeemed section */}
          {transaction.loyaltyDiscount > 0 && customer && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="flex justify-between text-gray-800">
                <span>
                  {t("pos.loyalty.pointsRedeemed", "Points Redeemed")}:
                </span>
                <span className="font-medium">
                  {transaction.loyaltyPointsRedeemed ||
                    Math.round(transaction.loyaltyDiscount / 0.01)}
                </span>
              </div>
              <div className="flex justify-between text-gray-800">
                <span>{t("pos.loyalty.discountValue", "Discount Value")}:</span>
                <span className="font-medium">
                  {formatPrice(transaction.loyaltyDiscount)}
                </span>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-gray-600 text-sm">
            <p>{t("pos.thankYou", "Thank you for your purchase!")}</p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-300 bg-gray-100 rounded-b-lg">
          {isPending ? (
            <div className="flex gap-2">
              <button
                className="btn btn-outline flex-1"
                onClick={onClose}
                disabled={isSaving}
              >
                {t("pos.cancel", "Cancel")}
              </button>
              <button
                className="btn btn-success flex-1 flex items-center justify-center gap-2"
                onClick={() => {
                  console.log("Confirm sale clicked with values:", {
                    amountTendered,
                    total,
                    isDisabled:
                      isSaving ||
                      !amountTendered ||
                      parseFloat(amountTendered) < total,
                  });
                  handleConfirmSale();
                }}
                disabled={
                  isSaving ||
                  !amountTendered ||
                  parseFloat(amountTendered) < total
                }
              >
                {isSaving ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <CheckCircle2 size={18} />
                )}
                <span>{t("pos.confirmSale", "Confirm Sale")}</span>
              </button>
            </div>
          ) : (
            <button className="btn btn-primary w-full" onClick={onNewSale}>
              {t("pos.newSale", "New Sale")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;
