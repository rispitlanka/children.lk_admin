import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/layout/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          light: "#FAFAFA",
          dark: "#0A0A0A",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#141414",
        },
        border: {
          light: "#E5E5E5",
          dark: "#262626",
        },
        text: {
          primary: "#171717",
          secondary: "#737373",
        },
        accent: {
          DEFAULT: "#4F6BF0",
          hover: "#435CD8",
        },
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#4F6BF0",
          600: "#435CD8",
          700: "#3749B4",
          800: "#2D3A8F",
          900: "#242E70",
        },
        gray: {
          50: "#FAFAFA",
          100: "#F4F4F5",
          200: "#E5E5E5",
          300: "#D4D4D8",
          400: "#A1A1AA",
          500: "#737373",
          600: "#52525B",
          700: "#3F3F46",
          800: "#262626",
          900: "#0A0A0A",
          dark: "#141414",
        },
      },
      borderRadius: {
        DEFAULT: "10px",
        sm: "10px",
        md: "10px",
        lg: "10px",
        xl: "10px",
        "2xl": "10px",
        "3xl": "10px",
        card: "10px",
        button: "10px",
        input: "10px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      boxShadow: {
        none: "none",
        "theme-xs": "none",
        "theme-sm": "none",
        "theme-md": "none",
        "theme-lg": "none",
        "theme-xl": "none",
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
      },
    },
  },
  plugins: [],
};

export default config;
