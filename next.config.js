const withFlowbiteReact = require('flowbite-react/plugin/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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

module.exports = withFlowbiteReact(nextConfig)
