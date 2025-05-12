const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  // Send from renderer to main
  send: (channel, data) => {
    // whitelist channels
    const validChannels = ["toMain"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // Receive from main to renderer
  receive: (channel, func) => {
    const validChannels = ["fromMain", "update-message"];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  // Invoke method from renderer to main and wait for response
  invoke: async (channel, data) => {
    const validChannels = ["get-app-path", "get-version", "check-for-updates"];
    if (validChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, data);
    }
    return null;
  },
  // Specifically for app updates
  updates: {
    checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
    onUpdateMessage: (callback) => {
      ipcRenderer.on("update-message", (event, message) => callback(message));
    },
    getAppVersion: () => ipcRenderer.invoke("get-version"),
  },
});
