/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/trading',
  images: {
    unoptimized: true,
    domains: ['api.allorigins.win'],
  },
  trailingSlash: true,
}

module.exports = nextConfig 