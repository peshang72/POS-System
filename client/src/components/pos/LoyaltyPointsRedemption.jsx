import { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Coins, CheckCircle, AlertCircle } from "lucide-react";

const LoyaltyPointsRedemption = ({
  customer,
  onRedemptionComplete,
  onClose,
  currency,
  exchangeRate,
}) => {
  const { t } = useTranslation();
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [redemptionResult, setRedemptionResult] = useState(null);

  // Helper function to format price based on currency
  const formatPrice = (priceUSD) => {
    if (currency === "USD") {
      return `$${priceUSD.toFixed(2)}`;
    } else {
      const priceIQD = priceUSD * exchangeRate;
      return `${priceIQD.toLocaleString()} IQD`;
    }
  };

  // Handle points input change
  const handlePointsChange = (e) => {
    const value = parseInt(e.target.value, 10);

    if (isNaN(value)) {
      setPointsToRedeem(0);
      return;
    }

    // Cannot redeem more points than customer has
    if (value > customer.loyaltyPoints) {
      setPointsToRedeem(customer.loyaltyPoints);
    } else {
      setPointsToRedeem(value);
    }
  };

  // Handle max points button click
  const handleUseMaxPoints = () => {
    setPointsToRedeem(customer.loyaltyPoints);
  };

  // Handle redemption
  const handleRedeem = async () => {
    if (pointsToRedeem <= 0) {
      setError(t("pos.loyalty.minimumPointsError"));
      return;
    }

    if (pointsToRedeem > customer.loyaltyPoints) {
      setError(t("pos.loyalty.insufficientPointsError"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/transactions/redeem", {
        customerId: customer._id,
        points: pointsToRedeem,
      });

      setRedemptionResult(response.data.data);

      // Pass the result to parent component
      if (onRedemptionComplete) {
        onRedemptionComplete(response.data.data);
      }
    } catch (error) {
      console.error("Error redeeming points:", error);
      setError(error.response?.data?.error || t("pos.loyalty.redemptionError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-base-200 border border-gray-700 rounded-lg p-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Coins size={18} className="mr-2 text-primary" />
          {t("pos.loyalty.title")}
        </h3>
        {customer && (
          <div className="text-sm">
            <span className="text-gray-400">
              {t("pos.loyalty.availablePoints")}:{" "}
            </span>
            <span className="font-semibold text-primary">
              {customer.loyaltyPoints}
            </span>
          </div>
        )}
      </div>

      {!customer ? (
        <div className="bg-warning/10 text-warning p-3 rounded-md text-sm mb-4">
          <AlertCircle size={16} className="inline-block mr-1" />
          {t("pos.loyalty.noCustomerSelected")}
        </div>
      ) : customer.loyaltyPoints <= 0 ? (
        <div className="bg-warning/10 text-warning p-3 rounded-md text-sm mb-4">
          <AlertCircle size={16} className="inline-block mr-1" />
          {t("pos.loyalty.noPointsAvailable")}
        </div>
      ) : redemptionResult ? (
        <div className="bg-success/10 text-success p-3 rounded-md text-sm mb-4">
          <CheckCircle size={16} className="inline-block mr-1" />
          {t("pos.loyalty.redemptionSuccess", {
            points: redemptionResult.pointsRedeemed,
            value: formatPrice(redemptionResult.monetaryValue),
          })}
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-error/10 text-error p-3 rounded-md text-sm mb-4">
              <AlertCircle size={16} className="inline-block mr-1" />
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="text-sm text-gray-400 block mb-1">
              {t("pos.loyalty.pointsToRedeem")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="input input-bordered w-full"
                value={pointsToRedeem}
                onChange={handlePointsChange}
                min="0"
                max={customer.loyaltyPoints}
                disabled={isLoading}
              />
              <button
                className="btn btn-sm btn-outline"
                onClick={handleUseMaxPoints}
                disabled={isLoading}
              >
                {t("pos.loyalty.max")}
              </button>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              className="btn btn-sm btn-outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleRedeem}
              disabled={pointsToRedeem <= 0 || isLoading}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                t("pos.loyalty.redeemButton")
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LoyaltyPointsRedemption;
