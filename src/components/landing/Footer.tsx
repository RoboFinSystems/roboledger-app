'use client'

import { LandingFooter } from '@robosystems/core'
import { HARBINGER_URL } from './constants'
import ContactModal from './ContactModal'

export default function Footer() {
  return (
    <LandingFooter
      tagline="Open-source, AI-native accounting on the RoboSystems knowledge graph platform — from business events to validated, XBRL-ready statements."
      productLinks={[
        { label: 'How it works', href: '#how-it-works' },
        { label: 'Features', href: '#features' },
        { label: 'Platform', href: '#platform' },
        { label: 'Done for you', href: HARBINGER_URL },
        { label: 'FAQ', href: '#faq' },
      ]}
      // The Company column's Blog link goes to this site's own lane (core 0.8.8).
      blogHref="/blog"
      contactModal={ContactModal}
    />
  )
}
