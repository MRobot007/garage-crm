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
          DEFAULT: "#e11f26", // racing red — from the VOZIDEX Customs logo
          hover: "#b8171d", // darker red
        },
        ink: "#1b1e24", // graphite charcoal (primary text)
        line: "#e2e5ea", // neutral steel border
        // status
        ok: "#0f9d76",
        warn: "#c98a2b",
        bad: "#dc2626",

        // shadcn/ui tokens (new keys only — consumed by components/ui/shadcn).
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
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
