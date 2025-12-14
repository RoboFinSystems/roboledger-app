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
  title: 'RoboLedger',
  description:
    'A comprehensive financial reporting app for private companies to securely share financial reports with shareholders and stakeholders. Built with React, Tailwind CSS, and Flowbite, it provides features such as customizable reports, user permissions, and real-time collaboration.',
  icons: {
    icon: '/images/logo.png',
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
