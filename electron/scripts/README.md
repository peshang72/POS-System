# Build Scripts

This directory contains utility scripts for building and packaging the application.

## download-node-windows.js

This script downloads a portable Node.js executable for Windows and includes it in the application build. This ensures the application can run its server component without requiring Node.js to be installed on the user's machine.

### Usage

```bash
# Download Node.js and build Windows app
npm run build-windows-with-node

# Or just download Node.js
npm run download-node-windows
```

The script downloads a specific version of Node.js (v18.18.0 LTS by default) and places it in:

1. `electron/assets/node.exe` - For development
2. `electron/resources/node.exe` - For packaging with electron-builder

During application startup, if the main process fails to start the server using the system's Node.js installation, it will attempt to use this bundled Node.js executable as a fallback.
