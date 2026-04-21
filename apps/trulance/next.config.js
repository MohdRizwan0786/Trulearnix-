/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['api.trulearnix.com', 'trulearnix.com', 'localhost', 's3.amazonaws.com'],
    unoptimized: true,
  },
}
module.exports = nextConfig
