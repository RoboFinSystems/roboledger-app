/**
 * Display names for Information Blocks.
 *
 * A library-seeded structure is named for its taxonomy first — "rs-gaap —
 * Balance Sheet — Classified". That lead segment is provenance, not the name
 * a reader looks for: in the Explorer's rail it was all that survived
 * truncation, and above a statement it reads as clutter.
 */

interface TaxonomyRef {
  taxonomyName?: string | null
  taxonomyId?: string | null
}

// A taxonomy id as a name's lead segment: "rs-gaap", "us-gaap", "ifrs-full".
const TAXONOMY_ID = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/

const SEPARATOR = ' — '

/**
 * `name` without a leading taxonomy segment. The segment is matched against
 * the block's own taxonomy, or recognised by shape when the block names none;
 * a lead segment that is neither ("Buffer — 2026-07 Prepaid") is left alone.
 */
export function withoutTaxonomy(name: string, block: TaxonomyRef = {}): string {
  const cut = name.indexOf(SEPARATOR)
  if (cut < 0) return name
  const lead = name.slice(0, cut)
  const isTaxonomy =
    lead === block.taxonomyName ||
    lead === block.taxonomyId ||
    TAXONOMY_ID.test(lead)
  return isTaxonomy ? name.slice(cut + SEPARATOR.length) : name
}
