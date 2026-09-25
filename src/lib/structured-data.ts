// Site-wide Schema.org structured data. The site block is rendered in the root layout so
// every page carries publisher identity; the SoftwareApplication block is rendered on the
// homepage.
//
// RoboLedger is a product, not a company: the publisher is the RoboSystems Organization,
// referenced by the `@id` robosystems.ai declares, so every Robo* site reads as one company
// and one founder whose credentials live on robosystems.ai/about. The WebSite node keeps
// this site's own name.

import { SITE_DESCRIPTION, SITE_NAME } from './site'

const SITE_URL = 'https://roboledger.ai'
const ORGANIZATION_ID = 'https://robosystems.ai/#organization'

const organization = {
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: 'RoboSystems',
  legalName: 'RFS LLC',
  url: 'https://robosystems.ai',
  logo: 'https://robosystems.ai/images/logos/robosystems-icon.png',
  sameAs: [
    'https://github.com/RoboFinSystems',
    'https://x.com/robofinsystems',
    'https://www.linkedin.com/company/robosystems',
    'https://www.youtube.com/@RoboSystems',
  ],
  founder: {
    '@type': 'Person',
    '@id': 'https://robosystems.ai/about#founder',
    name: 'Joseph T. French',
    url: 'https://robosystems.ai/about',
  },
}

export const websiteJsonLd = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  publisher: { '@id': ORGANIZATION_ID },
}

export const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [organization, websiteJsonLd],
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
  url: SITE_URL,
  image: `${SITE_URL}/images/logos/roboledger-icon.png`,
  publisher: { '@id': ORGANIZATION_ID },
}
