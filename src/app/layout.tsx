import { AuthProvider } from '@/lib/core'
import { SessionWarningDialog } from '@/lib/core/auth-components/SessionWarningDialog'
import { ThemeModeScript } from 'flowbite-react'
import type { Metadata, Viewport } from 'next'
import { twMerge } from 'tailwind-merge'

import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://robosystems.ai'),
  title: 'RoboSystems | Financial Knowledge Graphs for AI-Powered Intelligence',
  description:
    'Transform your financial data into a powerful knowledge graph. Connect QuickBooks, analyze with AI agents, and unlock insights hidden in relationships between revenue, costs, and operations.',
  keywords: [
    'financial knowledge graph',
    'graph database for finance',
    'AI financial analysis',
    'MCP tools',
    'GraphRAG finance',
    'QuickBooks integration',
    'financial intelligence platform',
    'open source financial software',
  ],
  authors: [{ name: 'Joey French' }],
  creator: 'RoboSystems',
  publisher: 'RoboSystems',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://robosystems.ai',
    siteName: 'RoboSystems',
    title:
      'RoboSystems | Financial Knowledge Graphs for AI-Powered Intelligence',
    description:
      'Transform your financial data into a powerful knowledge graph. Connect QuickBooks, analyze with AI agents, and unlock insights hidden in relationships.',
    images: [
      {
        url: '/images/logo_black.png',
        width: 512,
        height: 512,
        alt: 'RoboSystems - Financial Knowledge Graphs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RoboSystems | Financial Knowledge Graphs',
    description:
      'Transform financial data into powerful knowledge graphs. AI-powered analysis of relationships between revenue, costs, and operations.',
    images: ['/images/logo_black.png'],
    creator: '@robosystems',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/images/logos/robosystems.png',
    apple: '/images/logos/robosystems.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeModeScript />
      </head>
      <body
        className={twMerge('bg-zinc-50 font-sans dark:bg-black')}
        suppressHydrationWarning
      >
        <AuthProvider>
          <SessionWarningDialog />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
