// The homepage's identity in one place: the <title>, the search snippet, the social card,
// the Organization/SoftwareApplication JSON-LD and the web manifest all read from here.
// Until 2026-09-16 the social card, the JSON-LD and the manifest still carried the retired
// financial-reporting positioning while the page itself said "Connect your books. Ask
// Claude.", so a shared link and a search engine each described a different product.
// Since 2026-10-27 the homepage leads with the group (gtm/plan.md §1): each company's own
// books, the consolidation drafted by the assistant and posted by a person, never "the
// system consolidates" (§5). The description stays under 160 characters so results show it
// whole.

export const SITE_NAME = 'RoboLedger'

export const SITE_TITLE = 'RoboLedger | Multi-Entity Accounting with AI'

export const SITE_DESCRIPTION =
  "Each company keeps its own books and close. Your AI drafts the group's consolidating entries and you post them, from Claude, ChatGPT or any MCP client."
