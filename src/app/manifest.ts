import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RoboLedger | AI-Native Financial Reporting',
    short_name: 'RoboLedger',
    description:
      'AI-native financial reporting — turn natural language into complete, validated financial statements.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/images/logos/roboledger.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
