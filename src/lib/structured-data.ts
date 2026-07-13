// Site-wide Schema.org structured data. The Organization block is rendered in the root
// layout so every page carries publisher identity; the SoftwareApplication block is rendered
// on the homepage. `sameAs` mirrors the shared RoboFinSystems social profiles linked from
// the footer.

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'RoboLedger',
  url: 'https://roboledger.ai',
  logo: 'https://roboledger.ai/images/logos/roboledger.png',
  description:
    'AI-native financial reporting — turn natural language into complete, validated financial statements.',
  sameAs: [
    'https://github.com/RoboFinSystems',
    'https://x.com/robofinsystems',
    'https://www.linkedin.com/company/robofinsystems',
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
  name: 'RoboLedger',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  // No `offers` block: pricing/provisioning lives on the RoboSystems side and the
  // marketing page is intentionally price-silent, so we don't advertise a price
  // (a `price: '0'` Offer told search engines the app was free — it isn't).
  description:
    'AI-powered financial reporting platform. Transform natural language requests into complete, validated financial statements powered by Claude AI and RoboSystems.',
  url: 'https://roboledger.ai',
}
