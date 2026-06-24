'use client'

import { LandingFooter } from '@/lib/core'
import ContactModal from './ContactModal'

export default function Footer() {
  return (
    <LandingFooter
      tagline="AI-native accounting and financial close powered by the RoboSystems knowledge graph platform. From business events to validated, XBRL-ready statements."
      productLinks={[
        { label: 'Features', href: '#features' },
        { label: 'Workflow', href: '#workflow' },
        { label: 'AI Reporting', href: '#ai-reporting' },
        { label: 'Platform', href: '#platform' },
      ]}
      contactModal={ContactModal}
    />
  )
}
