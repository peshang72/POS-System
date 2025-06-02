import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Save,
  Info,
  ArrowLeft,
  DollarSign,
  AlertTriangle,
  Store,
  Globe,
  Settings,
  TrendingUp,
  Users,
  Shield,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const GeneralSettings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(1450);
  const [applyToAllUsers, setApplyToAllUsers] = useState(false);

  // Fetch general settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get("/api/settings/general");
        setSettings(response.data.data);

        // Set exchange rate from user-specific or global setting
        const userExchangeRate =
          response.data.data.userExchangeRates?.[user._id];
        const globalExchangeRate = response.data.data.exchangeRate;
        setExchangeRate(userExchangeRate || globalExchangeRate || 1450);
      } catch (error) {
        console.error("Error fetching general settings:", error);
        setError(
          t("settings.general.fetchError", "Failed to load general settings")
        );
        toast.error(
          t("settings.general.fetchError", "Failed to load general settings")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [t, user._id]);

  // Handle exchange rate change
  const handleExchangeRateChange = (e) => {
    const value = Math.max(1, Number(e.target.value));
    setExchangeRate(value);
  };

  // Save settings
  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        exchangeRate,
        applyToAllUsers: user.role === "admin" ? applyToAllUsers : false,
      };

      console.log("Sending payload:", payload);

      const response = await axios.put("/api/settings/general", payload);

      console.log("Server response:", response.data);

      // Update local settings with the response
      setSettings(response.data.data);

      toast.success(
        t("settings.general.saveSuccess", "Settings saved successfully")
      );

      // Reset apply to all users checkbox after saving
      setApplyToAllUsers(false);

      // Refresh the page data to show updated values
      const refreshResponse = await axios.get("/api/settings/general");
      setSettings(refreshResponse.data.data);

      // Update the displayed exchange rate
      const userExchangeRate =
        refreshResponse.data.data.userExchangeRates?.[user._id];
      const globalExchangeRate = refreshResponse.data.data.exchangeRate;
      setExchangeRate(userExchangeRate || globalExchangeRate || 1450);
    } catch (error) {
      console.error("Error saving general settings:", error);
      toast.error(
        error.response?.data?.message ||
          t("settings.general.saveError", "Failed to save settings")
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Link
              to="/settings"
              className="mr-4 p-2 rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <ArrowLeft
                size={20}
                className="text-gray-600 dark:text-gray-400"
              />
            </Link>
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg mr-4">
                <Settings className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t("settings.general.title", "General Settings")}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Configure your store's core settings
                </p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading settings...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Link
              to="/settings"
              className="mr-4 p-2 rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <ArrowLeft
                size={20}
                className="text-gray-600 dark:text-gray-400"
              />
            </Link>
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg mr-4">
                <Settings className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t("settings.general.title", "General Settings")}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Configure your store's core settings
                </p>
              </div>
            </div>
          </div>

          {/* Error State */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-red-200 dark:border-red-800">
            <div className="text-center">
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full inline-block mb-4">
                <AlertTriangle
                  className="text-red-600 dark:text-red-400"
                  size={32}
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <button
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors duration-300"
                onClick={() => window.location.reload()}
              >
                {t("common.retry", "Try Again")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has a personal rate vs using global rate
  const hasPersonalRate = settings?.userExchangeRates?.[user._id];
  const globalRate = settings?.exchangeRate;
  const currentUserRate = hasPersonalRate || globalRate || 1450;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            to="/settings"
            className="mr-4 p-2 rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group"
          >
            <ArrowLeft
              size={20}
              className="text-gray-600 dark:text-gray-400 group-hover:-translate-x-1 transition-transform duration-300"
            />
          </Link>
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg mr-4">
              <Settings className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t("settings.general.title", "General Settings")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Configure your store's core settings and preferences
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Currency Exchange Rate Settings - Takes 2 columns */}
          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-white/20 rounded-xl mr-4">
                    <DollarSign className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {t(
                        "settings.general.currencyExchange",
                        "Currency Exchange Rate"
                      )}
                    </h2>
                    <p className="text-green-100 mt-1">
                      Manage USD to IQD conversion rates
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Current Rate Display */}
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp
                        className="text-green-600 dark:text-green-400 mr-3"
                        size={20}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("settings.general.currentRate", "Current Rate")}:
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        1 USD = {currentUserRate.toLocaleString()} IQD
                      </span>
                      {hasPersonalRate ? (
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                          {t("settings.general.personal", "Personal")}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                          {t("settings.general.global", "Global")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Exchange Rate Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t(
                      "settings.general.usdToIqdRate",
                      "USD to IQD Exchange Rate"
                    )}
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-800">
                      <DollarSign
                        size={18}
                        className="text-blue-600 dark:text-blue-400 mr-2"
                      />
                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                        1 USD
                      </span>
                    </div>
                    <span className="text-gray-400 font-bold text-lg">=</span>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        min="1"
                        value={exchangeRate}
                        onChange={handleExchangeRateChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-lg font-semibold"
                        placeholder="1450"
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                        IQD
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-sm text-blue-600 dark:text-blue-400">
                    <Info size={14} className="mr-2" />
                    {t(
                      "settings.general.exchangeRateHelp",
                      "This rate will be used for currency conversion in the POS system"
                    )}
                  </div>
                </div>

                {/* Admin-only option to apply to all users */}
                {user.role === "admin" && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start mb-4">
                      <AlertTriangle
                        className="text-amber-600 dark:text-amber-400 mr-3 mt-0.5"
                        size={20}
                      />
                      <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                          Admin Override
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          {t(
                            "settings.general.adminWarning",
                            "As an admin, you can apply this exchange rate to all users, overriding their individual settings."
                          )}
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        checked={applyToAllUsers}
                        onChange={(e) => setApplyToAllUsers(e.target.checked)}
                      />
                      <span className="ml-3 text-sm font-medium text-amber-800 dark:text-amber-200">
                        {t(
                          "settings.general.applyToAllUsers",
                          "Apply this rate to all users"
                        )}
                      </span>
                    </label>
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      {t(
                        "settings.general.applyToAllUsersHelp",
                        "This will override individual exchange rate settings for all cashiers and managers"
                      )}
                    </p>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Save size={18} />
                    )}
                    <span>
                      {saving ? "Saving..." : t("common.save", "Save Changes")}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Store Info and Permissions */}
          <div className="space-y-6">
            {/* Store Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-lg mr-3">
                    <Store className="text-white" size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {t("settings.general.storeInfo", "Store Information")}
                  </h3>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("settings.general.storeName", "Store Name")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400"
                      value={settings?.storeName || "Lîstik Store"}
                      readOnly
                    />
                    <Clock
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                  </div>
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    {t(
                      "settings.general.storeNameHelp",
                      "Store name configuration coming soon"
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("settings.general.defaultLanguage", "Default Language")}
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 appearance-none"
                      value={settings?.defaultLanguage || "en"}
                      disabled
                    >
                      <option value="en">
                        {t("languages.english", "English")}
                      </option>
                      <option value="ku">
                        {t("languages.kurdish", "Kurdish")}
                      </option>
                    </select>
                    <Globe
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                  </div>
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    {t(
                      "settings.general.languageHelp",
                      "Language settings configuration coming soon"
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Permission Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-lg mr-3">
                    <Shield className="text-white" size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {t(
                      "settings.general.permissionInfo",
                      "Permission Information"
                    )}
                  </h3>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full mr-3 mt-0.5">
                      <CheckCircle
                        className="text-green-600 dark:text-green-400"
                        size={14}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Cashiers
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t(
                          "settings.general.cashierPermission",
                          "Can set their own exchange rate"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3 mt-0.5">
                      <CheckCircle
                        className="text-blue-600 dark:text-blue-400"
                        size={14}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Managers
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t(
                          "settings.general.managerPermission",
                          "Can set their own exchange rate"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-full mr-3 mt-0.5">
                      <Users
                        className="text-purple-600 dark:text-purple-400"
                        size={14}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Admins
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t(
                          "settings.general.adminPermission",
                          "Can set their own rate or apply to all users"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
