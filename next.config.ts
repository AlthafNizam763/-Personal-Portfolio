import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    // Uploaded media lives either on Vercel Blob (production) or on the local
    // filesystem under /public/uploads (development). Local paths need no
    // allow-listing; the Blob CDN host does.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Mongoose pulls in optional native/driver deps it does not actually need in
  // a serverless bundle. Marking it external keeps the trace clean.
  serverExternalPackages: ['mongoose', 'bcryptjs'],

  eslint: {
    dirs: ['app', 'components', 'lib', 'models', 'scripts'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        // Never let a proxy or browser cache an admin API response.
        source: '/api/admin/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ]
  },
}

export default nextConfig
