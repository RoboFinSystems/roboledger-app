'use client'

import AIReportingSection from '@/components/landing/AIReportingSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'
import Header from '@/components/landing/Header'
import HeroSection from '@/components/landing/HeroSection'
import OutputFormats from '@/components/landing/OutputFormats'
import PlatformSection from '@/components/landing/PlatformSection'
import ReportCreator from '@/components/landing/ReportCreator'
import WorkflowSection from '@/components/landing/WorkflowSection'

export default function LandingPageContent() {
  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main>
        <HeroSection />
        <FeaturesSection />
        <WorkflowSection />
        <ReportCreator />
        <OutputFormats />
        <AIReportingSection />
        <PlatformSection />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  )
}
