/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // three.js ships untranspiled ESM in some sub-paths; keep transpile explicit.
  transpilePackages: ["three"],
};

export default nextConfig;
