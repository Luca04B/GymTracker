/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Wichtig für static export mit dynamischen Features
  experimental: {
    missingSuspenseWithCSRBailout: false,
  }
}

module.exports = nextConfig