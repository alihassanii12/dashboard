/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ No basePath - dashboard root pe serve hoga
  // basePath: '',  // ← Empty or remove

  images: {
    domains: ['lh3.googleusercontent.com', 'image-library-backend-5ola.vercel.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/a/**',
      },
      {
        protocol: 'https',
        hostname: 'image-library-backend-5ola.vercel.app',
        pathname: '/**',
      },
    ],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // ✅ CORS headers for API routes (if needed)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;