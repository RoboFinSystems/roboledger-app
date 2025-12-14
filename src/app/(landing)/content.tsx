'use client'

import AIReportingSection from '@/components/landing/AIReportingSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'
import Header from '@/components/landing/Header'
import HeroSection from '@/components/landing/HeroSection'
import OpenSourceSection from '@/components/landing/OpenSourceSection'
import OutputFormats from '@/components/landing/OutputFormats'
import PlatformSection from '@/components/landing/PlatformSection'
import ReportCreator from '@/components/landing/ReportCreator'

export default function LandingPageContent() {
  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main>
        <HeroSection />
        <FeaturesSection />
        <ReportCreator />
        <OutputFormats />
        <AIReportingSection />
        <PlatformSection />
        <OpenSourceSection />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  )
}
