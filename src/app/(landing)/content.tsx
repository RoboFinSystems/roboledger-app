'use client'

import ApplicationsSection from '@/components/landing/ApplicationsSection'
import FeaturesGrid from '@/components/landing/FeaturesGrid'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'
import Header from '@/components/landing/Header'
import HeroSection from '@/components/landing/HeroSection'
import IntegrationsSection from '@/components/landing/IntegrationsSection'
import OpenSourceSection from '@/components/landing/OpenSourceSection'
import ProductOverview from '@/components/landing/ProductOverview'

export default function LandingPageContent() {
  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main>
        <HeroSection />
        <ProductOverview />
        <FeaturesGrid />
        <IntegrationsSection />
        <ApplicationsSection />
        <OpenSourceSection />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  )
}
