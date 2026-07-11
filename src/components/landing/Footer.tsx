'use client'

import { LandingFooter } from '@robosystems/core'
import ContactModal from './ContactModal'

export default function Footer() {
  return (
    <LandingFooter
      tagline="Open-source accounting powered by the RoboSystems knowledge graph platform. Build AI-native workflows from business events to validated, XBRL-ready statements."
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
