'use client'

import { PRODUCT_PAGES } from '@/lib/product-pages'
import { LandingFooter } from '@robosystems/core'
import ContactModal from './ContactModal'

export default function Footer() {
  return (
    <LandingFooter
      tagline="The general ledger built on RoboSystems, the open-source knowledge graph for finance."
      productLinks={[
        { label: 'How it works', href: '/#how-it-works' },
        { label: 'Consolidation', href: '/#groups' },
        { label: 'Features', href: '/#features' },
        { label: 'Platform', href: '/#platform' },
        { label: 'The Finance AI Pilot', href: '/#harbinger' },
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
