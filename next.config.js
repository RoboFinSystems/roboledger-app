import withFlowbiteReact from 'flowbite-react/plugin/nextjs'

// When tunneling in local dev (ngrok or cloudflared), the browser hits the
// public tunnel URL while the API runs on localhost:8000. Chrome's Private
// Network Access blocks public→loopback fetches, so we proxy API paths
// through the Next dev server (same-origin from the browser) to localhost.
// Active only when PUBLIC_TUNNEL_DOMAIN is set — inert in prod and in
// non-tunneled dev.
//
// NOTE: This is intended for host-run `next dev`. Running roboledger-app
// inside Docker uses `next start` with NEXT_PUBLIC_* baked at build time, so
// the env override below wouldn't take effect there. Follow the Connecting-
// QuickBooks-Locally wiki for the host-run setup.
const tunnelDomain = process.env.PUBLIC_TUNNEL_DOMAIN?.replace(
  /^https?:\/\//,
  ''
).replace(/\/$/, '')

// .env files are loaded before next.config.js, so a NEXT_PUBLIC_ROBOSYSTEMS_API_URL
// already set there would normally end up baked into the client bundle as-is.
// Mutate process.env here (before Next compiles the bundle) so the client SDK
// targets the tunnel origin when a tunnel is active.
if (tunnelDomain) {
  process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL = `https://${tunnelDomain}`
}

// allowedDevOrigins precedence: explicit NEXT_ALLOWED_DEV_ORIGINS takes over
// entirely (override — user owns the full list, including the tunnel host if
// they want it). Otherwise auto-derive from the tunnel domain when set.
/** @type {import('next').NextConfig} */
const allowedDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS
  ? process.env.NEXT_ALLOWED_DEV_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean)
  : tunnelDomain
    ? [tunnelDomain]
    : []

const nextConfig = {
  reactStrictMode: true,
  // Server Actions POST to the page route and Next rejects the request unless
  // the browser `Origin` matches the `Host`/`x-forwarded-host` it sees. In prod
  // the app runs on App Runner behind CloudFront, whose origin is the raw
  // `*.awsapprunner.com` host — so Next never sees `roboledger.ai` and every
  // action (graph/entity selection persistence) 500s. Allow the public origin
  // explicitly so the CSRF origin check passes. www redirects to the apex, so
  // only the apex is listed.
  experimental: {
    serverActions: {
      allowedOrigins: ['roboledger.ai'],
    },
  },
  allowedDevOrigins,
  // The Block Explorer shipped at /analytics before it was renamed; keep
  // old links working.
  async redirects() {
    return [{ source: '/analytics', destination: '/explorer', permanent: true }]
  },
  async rewrites() {
    if (!tunnelDomain) return []
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
