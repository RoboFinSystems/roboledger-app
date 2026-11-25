// The homepage's identity in one place: the <title>, the search snippet, the social card,
// the Organization/SoftwareApplication JSON-LD and the web manifest all read from here.
// Until 2026-09-16 the social card, the JSON-LD and the manifest still carried the retired
// financial-reporting positioning while the page itself said "Connect your books. Ask
// Claude.", so a shared link and a search engine each described a different product.
// On 2026-11-16 the title took the search term the page is written for ("AI accounting
// software", with ownership as the difference) and the H1 moved with it, so the tab, the
// result and the page say the same thing. The description names RoboLedger as the general
// ledger built on RoboSystems and stays under 160 characters so results show it whole.

export const SITE_NAME = 'RoboLedger'

export const SITE_TITLE =
  'RoboLedger: AI accounting software, built as a knowledge graph'

export const SITE_DESCRIPTION =
  'The general ledger built on RoboSystems, the open-source knowledge graph for finance: every number traced to its entries, one graph for the whole group.'
