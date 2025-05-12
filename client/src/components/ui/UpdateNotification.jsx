import { useEffect, useState } from "react";
import { AlertCircle, Download, Info, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const UpdateNotification = () => {
  const { t } = useTranslation();
  const [updateStatus, setUpdateStatus] = useState("");
  const [version, setVersion] = useState("");
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Check if we're in Electron environment
    if (window.api && window.api.updates) {
      // Get current version
      window.api.updates
        .getAppVersion()
        .then((version) => setVersion(version))
        .catch((err) => console.error("Error getting app version:", err));

      // Listen for update messages
      window.api.updates.onUpdateMessage((message) => {
        setUpdateStatus(message);
        setShowNotification(true);
      });
    }
  }, []);

  const checkForUpdates = () => {
    if (window.api && window.api.updates) {
      setUpdateStatus(t("settings.checkingForUpdates"));
      setShowNotification(true);

      window.api.updates
        .checkForUpdates()
        .then((result) => {
          if (!result.success) {
            setUpdateStatus(
              result.message || t("settings.errorCheckingUpdates")
            );
          }
        })
        .catch((err) => {
          setUpdateStatus(t("settings.errorCheckingUpdates"));
          console.error("Error checking for updates:", err);
        });
    } else {
      setUpdateStatus(t("settings.updatesNotAvailable"));
      setShowNotification(true);
    }
  };

  if (!showNotification) return null;

  // Determine which icon to show based on the update status
  let icon = <Info className="h-5 w-5 text-blue-500" />;
  let bgColor = "bg-blue-50";
  let borderColor = "border-blue-200";

  if (updateStatus.includes("Error") || updateStatus.includes("error")) {
    icon = <AlertCircle className="h-5 w-5 text-red-500" />;
    bgColor = "bg-red-50";
    borderColor = "border-red-200";
  } else if (
    updateStatus.includes("latest") ||
    updateStatus.includes("not available")
  ) {
    icon = <CheckCircle className="h-5 w-5 text-green-500" />;
    bgColor = "bg-green-50";
    borderColor = "border-green-200";
  } else if (updateStatus.includes("Download")) {
    icon = <Download className="h-5 w-5 text-yellow-500" />;
    bgColor = "bg-yellow-50";
    borderColor = "border-yellow-200";
  }

  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} border ${borderColor} rounded-lg shadow-md p-4 max-w-md z-50`}
    >
      <div className="flex">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-900">
            {version && `v${version} - `}
            {t("settings.appUpdates")}
          </h3>
          <div className="mt-2 text-sm text-gray-700">
            <p>{updateStatus}</p>
          </div>
          <div className="mt-3 flex space-x-2">
            <button
              type="button"
              onClick={checkForUpdates}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {t("settings.checkForUpdates")}
            </button>
            <button
              type="button"
              onClick={() => setShowNotification(false)}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {t("common.dismiss")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
