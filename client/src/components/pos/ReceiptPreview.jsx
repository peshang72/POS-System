import { X, Printer, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

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

  if (!isOpen || !transaction) return null;

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
                onClick={() => window.print()}
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
                {isPending
                  ? t("pos.pending", "Pending")
                  : transaction._id?.substring(0, 8) || "N/A"}
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
                onClick={onConfirm}
                disabled={isSaving}
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
