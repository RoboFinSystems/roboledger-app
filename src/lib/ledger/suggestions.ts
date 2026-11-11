/**
 * Where a bank line's suggested account came from.
 *
 * The server stamps `metadata.suggestion_source` on every captured line that
 * carries a suggestion: `open_item` is an open bill or invoice of the
 * counterparty's that the line pays exactly, so taking it settles that item;
 * `agent_default` is the counterparty's own default, learned from the lines
 * committed before it; `tier0` is only the bank's
 * category, resolved on the chart; `ai` is an in-app classifier's proposal.
 * `suggestion_basis` is the one-line reason a person can read.
 */

export type SuggestionSource = 'open_item' | 'agent_default' | 'tier0' | 'ai'

const SOURCE_LABELS: Record<SuggestionSource, string> = {
  open_item: 'Open item',
  agent_default: 'Learned',
  tier0: 'Bank category',
  ai: 'AI',
}

const SOURCE_COLORS: Record<SuggestionSource, string> = {
  open_item: 'info',
  agent_default: 'success',
  tier0: 'gray',
  ai: 'purple',
}

export const isSuggestionSource = (value: unknown): value is SuggestionSource =>
  value === 'open_item' ||
  value === 'agent_default' ||
  value === 'tier0' ||
  value === 'ai'

/** The source stamped on a line's metadata, or null when it carries none. */
export const suggestionSourceOf = (
  metadata: unknown
): SuggestionSource | null => {
  const source = (metadata as { suggestion_source?: unknown } | null)
    ?.suggestion_source
  return isSuggestionSource(source) ? source : null
}

export const suggestionSourceLabel = (source: SuggestionSource): string =>
  SOURCE_LABELS[source]

export const suggestionSourceColor = (source: SuggestionSource): string =>
  SOURCE_COLORS[source]
