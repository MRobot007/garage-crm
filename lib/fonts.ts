// Condensed, industrial display face (Oswald) — echoes the bold, sporty VOZIDEX
// logo. Loaded at runtime via a <link> in app/layout.tsx and mapped to the
// `.font-display` class in globals.css. We load it this way (instead of a
// build-time next/font fetch) so a font-CDN hiccup can never fail the CI build.
export const displayFont = { className: "font-display" } as const;
