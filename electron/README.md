# Gaming POS System - Desktop Application

This directory contains the Electron configuration for running the Gaming POS System as a desktop application.

## Setup

### Easy Setup (Recommended)

Run the automated setup script:

```
node electron/setup.js
```

From the project root, or:

```
./setup.js
```

From within this directory.

This will:

1. Check your project structure
2. Create necessary directories
3. Install dependencies
4. Fix any deprecated packages
5. Provide fallback files if builds fail

### Manual Setup

1. Install all dependencies:

   ```
   npm run install-all
   ```

   From the project root, or:

   ```
   npm install
   ```

   From within this directory.

2. Run the setup script to prepare the Electron environment:

   ```
   npm run setup-electron
   ```

   From the project root.

3. Fix any deprecated dependencies:

   ```
   npm run fix-deps
   ```

   From within this directory.

## Development

To run the application in development mode:

```
npm run electron:dev
```

This will start:

- The backend server
- The frontend dev server
- The Electron app in development mode

## Building for Windows

To build the Windows desktop application:

```
npm run build:win
```

From the project root directory. This will:

1. Build the client
2. Build the server
3. Package everything into a Windows installer

The output will be in the `electron/dist` directory.

## Building for Other Platforms

For other platforms, use:

```
npm run build:electron
```

This will build for your current platform.

## Fixing Dependency Issues

If you encounter dependency warnings about deprecated packages (such as `inflight`, `glob`, or `boolean`), you can fix them using:

```
npm run fix-deps
```

This will update the problematic dependencies to their latest versions and ensure compatibility.

## Troubleshooting

### Client or server build fails

The setup now creates placeholder files when builds fail. You can still run the Electron app in development mode by starting the development servers separately.

### Dependency warnings

If you see npm dependency warnings, run `npm run fix-deps` to fix them.

### Error loading application

Make sure the client and server are built properly and the development servers are running when in development mode.

## Application Structure

- `src/main.js` - Main Electron process
- `src/preload.js` - Preload script for secure communication
- `assets/` - Application icons and resources
- `electron-builder.yml` - Build configuration
- `setup.js` - Easy setup script
- `install.js` - Installation helper
- `fix-deps.js` - Script to fix dependency issues

## Notes

- The application runs the frontend and backend together in a single package
- In development mode, it connects to the development servers
- In production mode, it serves the built frontend and runs the backend inside the Electron app
