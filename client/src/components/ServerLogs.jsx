import React, { useState, useEffect, useRef } from "react";

const ServerLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const logContainerRef = useRef(null);

  useEffect(() => {
    // Check if running in Electron
    const electron = window?.api;
    setIsElectron(!!electron);

    if (electron && electron.serverLogs) {
      // Listen for server logs
      electron.serverLogs.onLog((log) => {
        setLogs((prevLogs) => {
          // Keep only the last 100 logs to prevent memory issues
          const newLogs = [...prevLogs, { ...log, timestamp: new Date() }];
          if (newLogs.length > 100) {
            return newLogs.slice(-100);
          }
          return newLogs;
        });
      });
    }
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current && isExpanded) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isExpanded]);

  if (!isElectron) return null;

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-sm mb-4">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-medium text-lg">Server Logs</h3>
        <span>{isExpanded ? "▲" : "▼"}</span>
      </div>

      {isExpanded && (
        <div
          ref={logContainerRef}
          className="mt-2 p-2 bg-black text-green-400 rounded font-mono text-xs h-64 overflow-y-auto"
        >
          {logs.length === 0 ? (
            <p className="text-gray-400">No server logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`mb-1 ${
                  log.type === "error" ? "text-red-400" : "text-green-400"
                }`}
              >
                <span className="text-gray-400">
                  {log.timestamp.toISOString().slice(11, 19)}
                </span>{" "}
                {log.message}
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-2 flex space-x-2">
        <button
          onClick={() => setLogs([])}
          className="px-3 py-1 bg-red-500 text-white rounded-md text-sm"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
};

export default ServerLogs;
