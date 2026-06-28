import { softwareJsonLd } from '@/lib/structured-data'
import LandingGate from './LandingGate'
import { landingMetadata } from './metadata'

export const metadata = landingMetadata

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <LandingGate />
    </>
  )
}
