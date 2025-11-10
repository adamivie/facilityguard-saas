/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' for full-stack Amplify deployment
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  // Enable experimental features for better Amplify integration
  experimental: {
    serverComponentsExternalPackages: ['aws-amplify'],
  },
}

module.exports = nextConfig