import type { Config } from "tailwindcss";

/**
 * Plain, minimal design system.
 * One accent (blue), neutral grays, restrained status colors.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2563eb", // primary blue
          hover: "#1d4ed8",
        },
        ink: "#1f2937", // primary text
        line: "#e5e7eb", // borders
        // status
        ok: "#16a34a",
        warn: "#d97706",
        bad: "#dc2626",
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "8px",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      spacing: {
        // 8px scale is default in tailwind; add a couple helpers
        18: "4.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
