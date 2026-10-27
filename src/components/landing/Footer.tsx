'use client'

import { PRODUCT_PAGES } from '@/lib/product-pages'
import { LandingFooter } from '@robosystems/core'
import { HARBINGER_URL } from './constants'
import ContactModal from './ContactModal'

export default function Footer() {
  return (
    <LandingFooter
      tagline="Open-source, AI-native accounting for a company or a whole group, on the RoboSystems knowledge graph: from business events to consolidated, XBRL-ready statements."
      productLinks={[
        { label: 'How it works', href: '/#how-it-works' },
        { label: 'Consolidation', href: '/#groups' },
        { label: 'Features', href: '/#features' },
        { label: 'Platform', href: '/#platform' },
        { label: 'Implementation', href: HARBINGER_URL },
        { label: 'FAQ', href: '/#faq' },
        { label: 'Docs', href: '/docs' },
        ...PRODUCT_PAGES.map((page) => ({
          label: page.navLabel,
          href: page.path,
        })),
      ]}
      // The Company column's Blog link goes to this site's own lane (core 0.8.8).
      blogHref="/blog"
      contactModal={ContactModal}
    />
  )
}
