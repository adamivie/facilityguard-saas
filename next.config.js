/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed static export for server-side deployment
  experimental: {
    serverComponentsExternalPackages: [],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig