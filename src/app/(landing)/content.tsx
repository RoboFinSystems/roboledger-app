'use client'

import ContrastSection from '@/components/landing/ContrastSection'
import FaqSection from '@/components/landing/FaqSection'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'
import HarbingerSection from '@/components/landing/HarbingerSection'
import Header from '@/components/landing/Header'
import HeroSection from '@/components/landing/HeroSection'
import HowItWorks from '@/components/landing/HowItWorks'
import OpenSourceStrip from '@/components/landing/OpenSourceStrip'
import PlatformSection from '@/components/landing/PlatformSection'
import ProofBand from '@/components/landing/ProofBand'
import Spotlights from '@/components/landing/Spotlights'

export default function LandingPageContent() {
  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main>
        <HeroSection />
        <ProofBand />
        <ContrastSection />
        <HowItWorks />
        <Spotlights />
        <PlatformSection />
        <OpenSourceStrip />
        <HarbingerSection />
        <FaqSection />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  )
}
