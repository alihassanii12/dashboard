/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Important: Dashboard ko /dashboard basePath pe serve karo
  basePath: '/dashboard',
  assetPrefix: '/dashboard-static',
  
  images: {
    domains: ['lh3.googleusercontent.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/a/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;