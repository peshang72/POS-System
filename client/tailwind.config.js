/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary colors
        "primary-bg": "#121212",
        "secondary-bg": "#262626",
        accent: "#7E3FF2",

        // Status colors
        success: "#36F2A3",
        warning: "#F2B705",
        error: "#F23557",
        info: "#3D9CF2",
      },
      fontFamily: {
        rajdhani: ["Rajdhani", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 5px theme(colors.accent)",
        "neon-success": "0 0 5px theme(colors.success)",
        "neon-warning": "0 0 5px theme(colors.warning)",
        "neon-error": "0 0 5px theme(colors.error)",
        "neon-info": "0 0 5px theme(colors.info)",
      },
    },
  },
  plugins: [],
};
