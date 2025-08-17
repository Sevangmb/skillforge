/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  distDir: 'out',
  assetPrefix: '',
  basePath: '',
  experimental: {
    appDir: true
  }
}

module.exports = nextConfig