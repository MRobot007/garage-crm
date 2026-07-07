import type { Config } from "tailwindcss";

/**
 * Elegant, calm design system.
 * Cool teal accent (complements the warm cream+red logo), soft neutrals,
 * restrained status colors.
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
          DEFAULT: "#0d9488", // teal-600 — calm, elegant accent
          hover: "#0f766e", // teal-700
        },
        ink: "#243b3a", // deep teal-tinted charcoal (primary text)
        line: "#dfe6e4", // soft cool border
        // status
        ok: "#0f9d76",
        warn: "#c98a2b",
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
