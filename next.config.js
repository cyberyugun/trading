/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  basePath: '/trading',
  images: {
    unoptimized: true,
    domains: ['api.allorigins.win'],
  },
  trailingSlash: true,
}

module.exports = nextConfig 