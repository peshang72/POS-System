import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Save, Info, PlusCircle, MinusCircle, ArrowLeft } from "lucide-react";

const LoyaltySettings = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch loyalty settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get("/api/loyalty/settings");
        setSettings(response.data.data);
      } catch (error) {
        console.error("Error fetching loyalty settings:", error);
        setError(
          t("settings.loyalty.fetchError", "Failed to load loyalty settings")
        );
        toast.error(
          t("settings.loyalty.fetchError", "Failed to load loyalty settings")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [t]);

  // Handle setting change
  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle tier change
  const handleTierChange = (index, field, value) => {
    const updatedTiers = [...settings.tiers];
    updatedTiers[index] = {
      ...updatedTiers[index],
      [field]: value,
    };

    setSettings((prev) => ({
      ...prev,
      tiers: updatedTiers,
    }));
  };

  // Add new tier
  const handleAddTier = () => {
    const newTier = {
      threshold: 0,
      bonusType: "fixed",
      bonusValue: 0,
    };

    setSettings((prev) => ({
      ...prev,
      tiers: [...(prev.tiers || []), newTier],
    }));
  };

  // Remove tier
  const handleRemoveTier = (index) => {
    const updatedTiers = [...settings.tiers];
    updatedTiers.splice(index, 1);

    setSettings((prev) => ({
      ...prev,
      tiers: updatedTiers,
    }));
  };

  // Save settings
  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.put("/api/loyalty/settings", settings);
      toast.success(
        t("settings.loyalty.saveSuccess", "Settings saved successfully")
      );
    } catch (error) {
      console.error("Error saving loyalty settings:", error);
      toast.error(t("settings.loyalty.saveError", "Failed to save settings"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Link to="/settings" className="mr-3 btn btn-sm btn-ghost">
            <ArrowLeft size={18} />
            <span className="ml-1">{t("common.back")}</span>
          </Link>
          <h1 className="text-2xl font-bold">{t("settings.loyalty.title")}</h1>
        </div>
        <div className="flex justify-center items-center h-48">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Link to="/settings" className="mr-3 btn btn-sm btn-ghost">
            <ArrowLeft size={18} />
            <span className="ml-1">{t("common.back")}</span>
          </Link>
          <h1 className="text-2xl font-bold">{t("settings.loyalty.title")}</h1>
        </div>
        <div className="p-6 bg-error/10 text-error rounded-lg">
          <p>
            {error || t("settings.loyalty.noSettings", "No settings found")}
          </p>
          <button
            className="btn btn-outline btn-error btn-sm mt-4"
            onClick={() => window.location.reload()}
          >
            {t("common.retry", "Retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link to="/settings" className="mr-3 btn btn-sm btn-ghost">
            <ArrowLeft size={18} />
            <span className="ml-1">{t("common.back")}</span>
          </Link>
          <h1 className="text-2xl font-bold">{t("settings.loyalty.title")}</h1>
        </div>
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <Save size={18} />
          )}
          <span>{t("common.save")}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <div className="card bg-base-200 shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {t("settings.loyalty.basicSettings")}
          </h2>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">
                {t("settings.loyalty.enabled")}
              </span>
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={settings.enabled}
                onChange={(e) => handleChange("enabled", e.target.checked)}
              />
              <span className="ml-2">
                {settings.enabled
                  ? t("settings.loyalty.programActive")
                  : t("settings.loyalty.programInactive")}
              </span>
            </div>
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">
                {t("settings.loyalty.pointsPerDollar")}
              </span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value={settings.pointsPerDollar}
              onChange={(e) =>
                handleChange("pointsPerDollar", parseFloat(e.target.value))
              }
              min="0"
              step="0.1"
            />
            <label className="label">
              <span className="label-text-alt text-info flex items-center">
                <Info size={14} className="mr-1" />
                {t("settings.loyalty.pointsPerDollarHelp")}
              </span>
            </label>
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">
                {t("settings.loyalty.redemptionRate")}
              </span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value={settings.redemptionRate}
              onChange={(e) =>
                handleChange("redemptionRate", parseFloat(e.target.value))
              }
              min="0"
              step="0.001"
            />
            <label className="label">
              <span className="label-text-alt text-info flex items-center">
                <Info size={14} className="mr-1" />
                {t("settings.loyalty.redemptionRateHelp")}
              </span>
            </label>
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">
                {t("settings.loyalty.minimumPoints")}
              </span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value={settings.minimumPoints}
              onChange={(e) =>
                handleChange("minimumPoints", parseInt(e.target.value))
              }
              min="0"
            />
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">
                {t("settings.loyalty.minimumRedemption")}
              </span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value={settings.minimumRedemption}
              onChange={(e) =>
                handleChange("minimumRedemption", parseInt(e.target.value))
              }
              min="0"
            />
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">
                {t("settings.loyalty.maximumRedemptionValue")}
              </span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value={settings.maximumRedemptionValue}
              onChange={(e) =>
                handleChange(
                  "maximumRedemptionValue",
                  parseFloat(e.target.value)
                )
              }
              min="0"
            />
          </div>
        </div>

        {/* Status Tiers */}
        <div className="card bg-base-200 shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {t("settings.loyalty.statusTiers")}
          </h2>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">
                {t("settings.loyalty.silverThreshold")}
              </span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value={settings.statusTiers?.silver || 0}
              onChange={(e) =>
                handleChange("statusTiers", {
                  ...settings.statusTiers,
                  silver: parseFloat(e.target.value),
                })
              }
              min="0"
            />
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">
                {t("settings.loyalty.goldThreshold")}
              </span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value={settings.statusTiers?.gold || 0}
              onChange={(e) =>
                handleChange("statusTiers", {
                  ...settings.statusTiers,
                  gold: parseFloat(e.target.value),
                })
              }
              min="0"
            />
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">
                {t("settings.loyalty.platinumThreshold")}
              </span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value={settings.statusTiers?.platinum || 0}
              onChange={(e) =>
                handleChange("statusTiers", {
                  ...settings.statusTiers,
                  platinum: parseFloat(e.target.value),
                })
              }
              min="0"
            />
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-4">
            {t("settings.loyalty.statusMultipliers")}
          </h3>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">
                {t("settings.loyalty.standardMultiplier")}
              </span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value={settings.statusMultipliers?.standard || 1}
              onChange={(e) =>
                handleChange("statusMultipliers", {
                  ...settings.statusMultipliers,
                  standard: parseFloat(e.target.value),
                })
              }
              min="1"
              step="0.1"
            />
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">
                {t("settings.loyalty.silverMultiplier")}
              </span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value={settings.statusMultipliers?.silver || 1}
              onChange={(e) =>
                handleChange("statusMultipliers", {
                  ...settings.statusMultipliers,
                  silver: parseFloat(e.target.value),
                })
              }
              min="1"
              step="0.1"
            />
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">
                {t("settings.loyalty.goldMultiplier")}
              </span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value={settings.statusMultipliers?.gold || 1}
              onChange={(e) =>
                handleChange("statusMultipliers", {
                  ...settings.statusMultipliers,
                  gold: parseFloat(e.target.value),
                })
              }
              min="1"
              step="0.1"
            />
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">
                {t("settings.loyalty.platinumMultiplier")}
              </span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value={settings.statusMultipliers?.platinum || 1}
              onChange={(e) =>
                handleChange("statusMultipliers", {
                  ...settings.statusMultipliers,
                  platinum: parseFloat(e.target.value),
                })
              }
              min="1"
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* Purchase Tiers */}
      <div className="card bg-base-200 shadow-md p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {t("settings.loyalty.purchaseTiers")}
          </h2>
          <button
            className="btn btn-sm btn-primary flex items-center gap-1"
            onClick={handleAddTier}
          >
            <PlusCircle size={16} />
            <span>{t("settings.loyalty.addTier")}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>{t("settings.loyalty.threshold")}</th>
                <th>{t("settings.loyalty.bonusType")}</th>
                <th>{t("settings.loyalty.bonusValue")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {settings.tiers && settings.tiers.length > 0 ? (
                settings.tiers.map((tier, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="number"
                        className="input input-bordered w-full"
                        value={tier.threshold}
                        onChange={(e) =>
                          handleTierChange(
                            index,
                            "threshold",
                            parseFloat(e.target.value)
                          )
                        }
                        min="0"
                      />
                    </td>
                    <td>
                      <select
                        className="select select-bordered w-full"
                        value={tier.bonusType}
                        onChange={(e) =>
                          handleTierChange(index, "bonusType", e.target.value)
                        }
                      >
                        <option value="fixed">
                          {t("settings.loyalty.fixed")}
                        </option>
                        <option value="percentage">
                          {t("settings.loyalty.percentage")}
                        </option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input input-bordered w-full"
                        value={tier.bonusValue}
                        onChange={(e) =>
                          handleTierChange(
                            index,
                            "bonusValue",
                            parseFloat(e.target.value)
                          )
                        }
                        min="0"
                        step={tier.bonusType === "percentage" ? "1" : "1"}
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-error"
                        onClick={() => handleRemoveTier(index)}
                      >
                        <MinusCircle size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    {t("settings.loyalty.noTiers")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p className="flex items-center">
            <Info size={14} className="mr-1" />
            {t("settings.loyalty.tiersHelp")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoyaltySettings;
