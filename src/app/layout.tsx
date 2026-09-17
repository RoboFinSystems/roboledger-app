import { CloudflareAnalytics } from '@/components/analytics/CloudflareAnalytics'
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from '@/lib/site'
import { organizationJsonLd } from '@/lib/structured-data'
import { AuthProvider, customTheme } from '@robosystems/core'
import { ThemeModeScript, ThemeProvider } from 'flowbite-react'
import type { Metadata, Viewport } from 'next'
import { twMerge } from 'tailwind-merge'

import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://roboledger.ai'),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://roboledger.ai',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // og:image comes from the generated app/opengraph-image.tsx (site-wide).
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // twitter:image comes from the generated app/twitter-image.tsx (site-wide).
    site: '@robofinsystems',
    creator: '@robofinsystems',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c'),
          }}
        />
      </head>
      <body
        className={twMerge('bg-zinc-50 font-sans dark:bg-black')}
        suppressHydrationWarning
      >
        <ThemeProvider theme={customTheme}>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <CloudflareAnalytics />
      </body>
    </html>
  )
}
