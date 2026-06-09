/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'api.grandmasala.in' },
      { protocol: 'https', hostname: 'grandmasala.in' },
      { protocol: 'https', hostname: 'someindiangirl.com' },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
  },
  // Enable standalone output for Docker/VPS deployment
  // output: 'standalone',

  // SEO: redirect trailing slashes
  trailingSlash: false,

  // Compress responses
  compress: true,

  // Environment variables available client-side
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },

  // Headers for SEO and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      // Old React routes to new Next.js routes
      { source: '/product-page/:id', destination: '/product/:id', permanent: true },
      { source: '/blogs-details', destination: '/blog', permanent: true },
      { source: '/receipt-cod/order-confirmed', destination: '/order-success', permanent: false },
      { source: '/Receipt/order-confirmed', destination: '/order-success', permanent: false },
    ];
  },
};

module.exports = nextConfig;
