/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/trading',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig 