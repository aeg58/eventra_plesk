import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary-color, #2563eb)",
        secondary: "var(--secondary-color, #64748b)",
      },
      fontFamily: {
        sans: ["var(--font-family, Aptos)", "Segoe UI", "-apple-system", "BlinkMacSystemFont", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      fontSize: {
        base: "var(--font-size-base, 16px)",
      },
    },
  },
  plugins: [],
};
export default config;

