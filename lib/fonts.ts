import { Oswald } from "next/font/google";

/**
 * Condensed, industrial display face — echoes the bold, sporty VOZIDEX logo.
 * Used for the brand wordmark and headline lockups (not body text).
 */
export const displayFont = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});
