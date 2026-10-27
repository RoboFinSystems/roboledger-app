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
  // The homepage names the price since 2026-10-27: the RoboSystems Standard plan, $99 a
  // month per graph (robosystems.ai/pricing, where billing reads it). Before that the page
  // was price-silent and this block had no offer; a `price: '0'` Offer once told search
  // engines the app was free, which it isn't.
  offers: {
    '@type': 'Offer',
    price: '99',
    priceCurrency: 'USD',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: '99',
      priceCurrency: 'USD',
      unitCode: 'MON',
    },
    url: 'https://robosystems.ai/pricing',
  },
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/images/logos/roboledger-icon.png`,
  publisher: { '@id': ORGANIZATION_ID },
}
