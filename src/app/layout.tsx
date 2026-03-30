import { AuthProvider } from '@/lib/core'
import { ThemeModeScript } from 'flowbite-react'
import type { Metadata, Viewport } from 'next'
import { twMerge } from 'tailwind-merge'

import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'RoboLedger | AI-Native Financial Reporting',
  description:
    'AI-powered financial reporting platform. Transform natural language requests into complete, validated financial statements powered by Claude AI and RoboSystems.',
  icons: {
    icon: '/images/logos/roboledger.png',
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
