/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Base path removed, dashboard root pe serve hoga
  // basePath: '/dashboard',   <-- REMOVE
  // assetPrefix: '/dashboard-static',  <-- REMOVE

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