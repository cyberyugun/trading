/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/trading',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig 