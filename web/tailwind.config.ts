import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1E3A5F",
          hover: "#152A45",
          light: "#2D5A7B",
        },
        secondary: "#4A6FA5",
        accent: "#2D5A7B",
        background: "#F8F9FA",
        surface: "#FFFFFF",
        border: "#E5E7EB",
        "text-primary": "#1A1A2E",
        "text-secondary": "#6B7280",
        success: "#059669",
        error: "#DC2626",
        warning: "#D97706",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
