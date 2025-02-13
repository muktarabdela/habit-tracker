/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: 'standalone',
  // Enable CSS optimization in production
  optimizeFonts: true,
  swcMinify: true,
  // ... other config options
};

module.exports = nextConfig;
