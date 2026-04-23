/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: 'trulearnix-media.s3.ap-south-1.amazonaws.com' },
      { protocol: 'https', hostname: 'api.trulearnix.com' },
      { protocol: 'https', hostname: 'qa-api.trulearnix.com' },
      { protocol: 'https', hostname: '*.r2.dev' }
    ]
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'trulearnix.com',
        'www.trulearnix.com',
        'qa.trulearnix.com',
        'localhost:3000',
        'localhost:3010'
      ]
    }
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_RAZORPAY_KEY: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
    }
    return config;
  },
};

module.exports = nextConfig;
