/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.trulearnix.com' },
      { protocol: 'https', hostname: 'qa-api.trulearnix.com' },
      { protocol: 'https', hostname: 'trulearnix.com' },
      { protocol: 'https', hostname: 'www.trulearnix.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: 'pub-*.r2.dev' },
    ],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_TRULANCE_URL: process.env.NEXT_PUBLIC_TRULANCE_URL,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  }
}
module.exports = nextConfig
