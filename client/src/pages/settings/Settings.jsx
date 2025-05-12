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
} from "lucide-react";

const Settings = () => {
  const { t } = useTranslation();

  // Define settings categories
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
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        <SettingsIcon className="inline-block mr-2" size={24} />
        {t("navigation.settings")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingCategories.map((category) => (
          <Link
            key={category.id}
            to={category.path}
            className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <category.icon className="text-primary mr-3" size={24} />
                  <h2 className="card-title text-lg">{category.name}</h2>
                </div>
                <ChevronRight size={20} className="text-gray-500" />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {category.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Placeholder for future settings that aren't implemented yet */}
      <div className="mt-8 p-4 bg-base-200 rounded-lg border border-gray-700">
        <p className="text-gray-400 text-center">
          {t(
            "settings.someNotImplemented",
            "Some settings pages are not fully implemented yet"
          )}
        </p>
      </div>
    </div>
  );
};

export default Settings;
