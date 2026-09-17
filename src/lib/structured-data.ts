// Site-wide Schema.org structured data. The Organization block is rendered in the root
// layout so every page carries publisher identity; the SoftwareApplication block is rendered
// on the homepage. `sameAs` mirrors the shared RoboFinSystems social profiles linked from
// the footer.

import { SITE_DESCRIPTION, SITE_NAME } from './site'

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: 'https://roboledger.ai',
  logo: 'https://roboledger.ai/images/logos/roboledger-icon.png',
  description: SITE_DESCRIPTION,
  sameAs: [
    'https://github.com/RoboFinSystems',
    'https://x.com/robofinsystems',
    'https://www.linkedin.com/company/robosystems',
    'https://www.youtube.com/@RoboSystems',
  ],
  founder: {
    '@type': 'Person',
    name: 'Joseph French',
  },
}

export const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  // No `offers` block: pricing/provisioning lives on the RoboSystems side and the
  // marketing page is intentionally price-silent, so we don't advertise a price
  // (a `price: '0'` Offer told search engines the app was free — it isn't).
  description: SITE_DESCRIPTION,
  url: 'https://roboledger.ai',
}
