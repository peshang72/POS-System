import React, { useState, useEffect } from "react";

const ElectronInfo = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [version, setVersion] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [serverStatus, setServerStatus] = useState({
    running: false,
    port: null,
  });
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(null);

  useEffect(() => {
    // Check if running in Electron
    const electron = window?.api;
    setIsElectron(!!electron);

    if (electron) {
      // Get app version
      electron
        .invoke("get-version")
        .then((version) => setVersion(version))
        .catch((err) => console.error("Failed to get version:", err));

      // Get platform info
      if (electron.appInfo) {
        setPlatform(electron.appInfo.getPlatform());
      }

      // Get server status
      electron
        .invoke("get-server-status")
        .then((status) => setServerStatus(status))
        .catch((err) => console.error("Failed to get server status:", err));

      // Listen for server status updates
      electron.receive("server-status", (status) => {
        setServerStatus((prev) => ({ ...prev, ...status }));
      });

      // Listen for update messages
      electron.updates.onUpdateMessage((message) => {
        setUpdateMessage(message);
      });
    }
  }, []);

  const checkForUpdates = () => {
    const electron = window?.api;
    if (electron) {
      setIsCheckingUpdates(true);
      setUpdateMessage("Checking for updates...");

      electron.updates
        .checkForUpdates()
        .then((result) => {
          if (result.success) {
            setUpdateMessage("Checking for updates... Please wait.");
          } else {
            setUpdateMessage(
              `Failed to check for updates: ${
                result.message || "Unknown error"
              }`
            );
          }
        })
        .catch((err) => {
          setUpdateMessage(`Error checking for updates: ${err.message || err}`);
        })
        .finally(() => {
          setTimeout(() => {
            setIsCheckingUpdates(false);
          }, 3000);
        });
    }
  };

  const restartServer = () => {
    const electron = window?.api;
    if (electron && electron.server) {
      setServerStatus((prev) => ({ ...prev, running: false }));
      electron.server
        .restart()
        .then((result) => {
          if (result.success) {
            setUpdateMessage(`Server: ${result.message}`);
          } else {
            setUpdateMessage(
              `Server error: ${result.message || "Unknown error"}`
            );
          }
        })
        .catch((err) => {
          setUpdateMessage(`Error restarting server: ${err.message || err}`);
        });
    }
  };

  if (!isElectron) return null;

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-sm mb-4">
      <h3 className="font-medium text-lg mb-2">Desktop App Information</h3>
      <div className="text-sm space-y-1">
        <p>Version: {version || "Unknown"}</p>
        <p>Platform: {platform || "Unknown"}</p>
        <p>
          Server Status:{" "}
          {serverStatus.running ? (
            <span className="text-green-600 font-medium">Running</span>
          ) : (
            <span className="text-red-600 font-medium">Not Running</span>
          )}
        </p>
        {serverStatus.port && <p>Server Port: {serverStatus.port}</p>}

        <div className="flex space-x-2 mt-2">
          <button
            onClick={checkForUpdates}
            disabled={isCheckingUpdates}
            className="px-3 py-1 bg-blue-500 text-white rounded-md disabled:bg-blue-300 text-sm"
          >
            Check for Updates
          </button>

          <button
            onClick={restartServer}
            disabled={!isElectron}
            className="px-3 py-1 bg-green-500 text-white rounded-md disabled:bg-green-300 text-sm"
          >
            Restart Server
          </button>
        </div>

        {updateMessage && (
          <div className="mt-2 text-sm p-2 bg-gray-200 rounded">
            {updateMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default ElectronInfo;
