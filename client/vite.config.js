import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs";
import path from "path";

// Detect if running in Electron
const isElectron = process.env.ELECTRON === "true";

// Helper function to copy locales to public folder
function copyLocalesPlugin() {
  return {
    name: "copy-locales",
    buildStart() {
      // Ensure directories exist
      const sourceDir = path.resolve(__dirname, "src/locales");
      const targetDir = path.resolve(__dirname, "public/locales");

      // Create language directories if they don't exist
      if (!fs.existsSync(path.join(targetDir, "en"))) {
        fs.mkdirSync(path.join(targetDir, "en"), { recursive: true });
      }
      if (!fs.existsSync(path.join(targetDir, "ku"))) {
        fs.mkdirSync(path.join(targetDir, "ku"), { recursive: true });
      }

      // Copy files
      fs.copyFileSync(
        path.join(sourceDir, "en.json"),
        path.join(targetDir, "en/translation.json")
      );
      fs.copyFileSync(
        path.join(sourceDir, "ku.json"),
        path.join(targetDir, "ku/translation.json")
      );

      console.log("Locales copied to public/locales directory");
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyLocalesPlugin()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  base: "/",
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    assetsInlineLimit: 4096,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false,
        pure_funcs: ["console.debug"],
      },
    },
    rollupOptions: {
      external: ["clsx", "tailwind-merge", "i18next-http-backend"],
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: [
            "react-hot-toast",
            "lucide-react",
            "chart.js",
            "react-chartjs-2",
          ],
          i18n: ["i18next", "react-i18next", "i18next-http-backend"],
          data: ["axios", "@tanstack/react-query"],
        },
        format: "es",
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
      input: {
        main: resolve(__dirname, "index.html"),
        // We'll handle locales through our plugin instead
      },
    },
    // Electron-specific optimizations
    ...(isElectron && {
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
    }),
  },
  // Properly handle file:// protocol in Electron
  define: {
    "process.env.ELECTRON": JSON.stringify(isElectron),
  },
});
