const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Ensure the src directory exists
const srcDir = path.join(__dirname, "src");
if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}

// Ensure the assets directory exists
const assetsDir = path.join(__dirname, "assets");
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Check if client directory exists
const clientDir = path.join(__dirname, "../client");
if (!fs.existsSync(clientDir)) {
  console.error("❌ Error: Client directory not found at", clientDir);
  console.log("Make sure the client application is in the correct location.");
  process.exit(1);
}

// Check if server directory exists
const serverDir = path.join(__dirname, "../server");
if (!fs.existsSync(serverDir)) {
  console.error("❌ Error: Server directory not found at", serverDir);
  console.log("Make sure the server application is in the correct location.");
  process.exit(1);
}

// Make sure client has package.json
const clientPackageJson = path.join(clientDir, "package.json");
if (!fs.existsSync(clientPackageJson)) {
  console.error(
    "❌ Error: Client package.json not found at",
    clientPackageJson
  );
  console.log("Make sure the client application is properly set up.");
  process.exit(1);
}

// Make sure server has package.json
const serverPackageJson = path.join(serverDir, "package.json");
if (!fs.existsSync(serverPackageJson)) {
  console.error(
    "❌ Error: Server package.json not found at",
    serverPackageJson
  );
  console.log("Make sure the server application is properly set up.");
  process.exit(1);
}

// Create client/dist if it doesn't exist
const clientDistDir = path.join(clientDir, "dist");
if (!fs.existsSync(clientDistDir)) {
  console.log("Building client...");
  try {
    fs.mkdirSync(clientDistDir, { recursive: true });
    execSync("cd ../client && npm run build", {
      stdio: "inherit",
      cwd: __dirname,
    });
  } catch (error) {
    console.error("❌ Error building client:", error.message);
    console.log(
      "Creating placeholder client/dist directory for development..."
    );

    // Create fallback index.html
    const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gaming POS System</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background-color: #f8f9fa;
      color: #212529;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 600px;
    }
    h1 {
      color: #3b82f6;
      margin-bottom: 1rem;
    }
    p {
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }
    .hint {
      background-color: #fff8e6;
      border-left: 4px solid #ffca28;
      padding: 1rem;
      margin-top: 1.5rem;
      text-align: left;
    }
    code {
      background-color: #f1f3f5;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Gaming POS System</h1>
    <p>The development build is not available. This is a placeholder page for the Electron desktop application.</p>
    <div class="hint">
      <p><strong>Hint:</strong> To properly build the client application, run:</p>
      <code>cd client && npm run build</code>
      <p>from the project root directory.</p>
    </div>
  </div>
</body>
</html>`;

    fs.writeFileSync(path.join(clientDistDir, "index.html"), fallbackHtml);
    console.log("✅ Created placeholder index.html for development");
  }
}

// Create server/dist if it doesn't exist
const serverDistDir = path.join(serverDir, "dist");
if (!fs.existsSync(serverDistDir)) {
  console.log("Building server...");
  try {
    fs.mkdirSync(serverDistDir, { recursive: true });
    execSync("cd ../server && npm run build", {
      stdio: "inherit",
      cwd: __dirname,
    });
  } catch (error) {
    console.error("❌ Error building server:", error.message);
    console.log(
      "Creating placeholder server/dist directory for development..."
    );

    // Create fallback server index.js
    const fallbackServer = `console.log('This is a placeholder for the server. Please build the actual server application.');
process.exit(1);`;

    fs.writeFileSync(path.join(serverDistDir, "index.js"), fallbackServer);
    console.log("✅ Created placeholder server files for development");
  }
}

// Install electron dependencies with force resolution
console.log("Installing Electron dependencies...");
try {
  // Instead of installing specific versions that might conflict with overrides,
  // let's install with --force which will respect our overrides in package.json
  execSync("npm install --force", {
    stdio: "inherit",
    cwd: __dirname,
  });
  console.log("✅ Dependencies installed successfully");
} catch (error) {
  console.error("⚠️ Error installing dependencies:", error.message);
  console.log(
    "Please try running 'npm run manual-setup' to install dependencies using an alternative method."
  );
}

console.log(
  '\nSetup complete! You can now run "npm start" to start the Electron app.'
);
console.log('To build for Windows, run "npm run build:win".');
