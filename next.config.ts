/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Wichtig für dynamische Routes mit static export
  experimental: {
    missingSuspenseWithCSRBailout: false,
  }
}

module.exports = nextConfig