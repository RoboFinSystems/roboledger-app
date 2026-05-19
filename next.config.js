import withFlowbiteReact from 'flowbite-react/plugin/nextjs'

/** @type {import('next').NextConfig} */
const allowedDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS
  ? process.env.NEXT_ALLOWED_DEV_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean)
  : []

// When tunneling via ngrok in local dev, the browser hits the ngrok URL while
// the API runs on localhost:8000. Chrome's Private Network Access blocks
// public→loopback fetches, so we proxy API paths through the Next dev server
// (same-origin from the browser) to localhost. Active only when NGROK_DOMAIN
// is set in the local env — inert in prod and in non-tunneled dev.
//
// NOTE: This is intended for host-run `next dev`. Running roboledger-app
// inside Docker uses `next start` with NEXT_PUBLIC_* baked at build time, so
// the env override below wouldn't take effect there. Follow the Connecting-
// QuickBooks-Locally wiki for the host-run setup.
const ngrokDomain = process.env.NGROK_DOMAIN

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins,
  env: ngrokDomain
    ? { NEXT_PUBLIC_ROBOSYSTEMS_API_URL: `https://${ngrokDomain}` }
    : {},
  async rewrites() {
    if (!ngrokDomain) return []
    return [
      { source: '/v1/:path*', destination: 'http://localhost:8000/v1/:path*' },
      {
        source: '/extensions/:path*',
        destination: 'http://localhost:8000/extensions/:path*',
      },
      {
        source: '/openapi.json',
        destination: 'http://localhost:8000/openapi.json',
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default withFlowbiteReact(nextConfig)
