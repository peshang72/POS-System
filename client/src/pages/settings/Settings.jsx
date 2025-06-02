import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Store,
  CreditCard,
  Printer,
  Globe,
  Users,
  Bell,
  Coins,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const Settings = () => {
  const { t } = useTranslation();

  // Define settings categories with enhanced styling data
  const settingCategories = [
    {
      id: "general",
      name: t("settings.general.title", "General Settings"),
      description: t(
        "settings.general.description",
        "Store information, language, and regional settings"
      ),
      icon: Store,
      path: "/settings/general",
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "loyalty",
      name: t("settings.loyalty.title", "Loyalty Program"),
      description: t(
        "settings.loyalty.description",
        "Configure points, rewards, and customer tiers"
      ),
      icon: Coins,
      path: "/settings/loyalty",
      gradient: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      iconColor: "text-yellow-600 dark:text-yellow-400",
    },
    {
      id: "payments",
      name: t("settings.payments.title", "Payment Methods"),
      description: t(
        "settings.payments.description",
        "Configure payment options and processors"
      ),
      icon: CreditCard,
      path: "/settings/payments",
      gradient: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      id: "receipts",
      name: t("settings.receipts.title", "Receipts & Printing"),
      description: t(
        "settings.receipts.description",
        "Receipt templates and printer settings"
      ),
      icon: Printer,
      path: "/settings/receipts",
      gradient: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      id: "users",
      name: t("settings.users.title", "User Permissions"),
      description: t(
        "settings.users.description",
        "Manage role-based access control"
      ),
      icon: Users,
      path: "/settings/users",
      gradient: "from-indigo-500 to-blue-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      id: "notifications",
      name: t("settings.notifications.title", "Notifications"),
      description: t(
        "settings.notifications.description",
        "Configure alerts and automated messages"
      ),
      icon: Bell,
      path: "/settings/notifications",
      gradient: "from-red-500 to-pink-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      iconColor: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-gradient-to-r from-primary to-secondary rounded-xl shadow-lg mr-4">
              <SettingsIcon className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t("navigation.settings")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your store configuration and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {settingCategories.map((category, index) => (
            <Link
              key={category.id}
              to={category.path}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02]"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
              />

              {/* Card Content */}
              <div className="relative p-6">
                {/* Icon Section */}
                <div
                  className={`inline-flex p-3 rounded-xl ${category.bgColor} mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <category.icon
                    className={`${category.iconColor}`}
                    size={24}
                  />
                </div>

                {/* Title and Description */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors duration-300">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {category.description}
                  </p>
                </div>

                {/* Arrow Icon */}
                <div className="flex justify-end">
                  <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <ChevronRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>

              {/* Hover Effect Border */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/20 transition-colors duration-300" />
            </Link>
          ))}
        </div>

        {/* Enhanced Info Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 p-6">
          <div className="absolute top-0 right-0 -mt-4 -mr-4">
            <Sparkles className="text-primary/20" size={48} />
          </div>
          <div className="relative">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-primary/20 rounded-lg mr-3">
                <SettingsIcon className="text-primary" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Development Status
              </h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t(
                "settings.developmentNote",
                "We're continuously improving your POS experience. Some advanced settings are still in development and will be available soon."
              )}
            </p>
            <div className="mt-4 flex items-center text-sm text-primary font-medium">
              <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
              More features coming soon
            </div>
          </div>
        </div>

        {/* Quick Stats or Additional Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                <Store className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active Settings
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {settingCategories.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                <Users
                  className="text-green-600 dark:text-green-400"
                  size={20}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  User Roles
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  3
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                <Bell
                  className="text-purple-600 dark:text-purple-400"
                  size={20}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Notifications
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Active
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
