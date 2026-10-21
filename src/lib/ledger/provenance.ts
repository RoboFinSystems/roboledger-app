/**
 * A report fact's own provenance, read off the wire.
 *
 * The envelope carries each fact's `provenance` as the server's typed
 * descriptor serialized to JSON, discriminated on `origin`. This narrows
 * it into the three constructions a figure can drill on — a pivot over
 * accounts (or through a flow filter), a rollup over concepts, a derivation
 * by parts — and keeps any other arm as what it says it is.
 */

export interface FactSource {
  entity_id: string
  account_id: string
  value: number
}

export interface RollupChild {
  qname: string
  weight: number
}

export type FactDescriptor =
  | {
      origin: 'pivot'
      sources: FactSource[] | null
      postingFilter: Record<string, unknown> | null
      contentHash: string | null
      lineCount: number | null
    }
  | { origin: 'rollup'; rule: string; children: RollupChild[] }
  | {
      origin: 'derived'
      computation: string | null
      formula: string | null
      sourceConcepts: string[]
      amounts: Record<string, number> | null
      sources: FactSource[] | null
    }
  | { origin: 'other'; kind: string; detail: Record<string, unknown> }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asSources = (value: unknown): FactSource[] | null => {
  if (!Array.isArray(value)) return null
  const sources: FactSource[] = []
  for (const item of value) {
    if (!isRecord(item)) continue
    const { entity_id, account_id, value: amount } = item
    if (
      typeof entity_id === 'string' &&
      typeof account_id === 'string' &&
      typeof amount === 'number'
    ) {
      sources.push({ entity_id, account_id, value: amount })
    }
  }
  return sources
}

const asAmounts = (value: unknown): Record<string, number> | null => {
  if (!isRecord(value)) return null
  const amounts: Record<string, number> = {}
  for (const [name, amount] of Object.entries(value)) {
    if (typeof amount === 'number') amounts[name] = amount
  }
  return amounts
}

const asString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null

/** The fact's descriptor, or null for a fact that does not say how it was
 *  made — which reads as unknown, never as a claim. */
export function describeFact(provenance: unknown): FactDescriptor | null {
  if (!isRecord(provenance) || typeof provenance.origin !== 'string') {
    return null
  }
  switch (provenance.origin) {
    case 'pivot':
      return {
        origin: 'pivot',
        sources: asSources(provenance.sources),
        postingFilter: isRecord(provenance.posting_filter)
          ? provenance.posting_filter
          : null,
        contentHash: asString(provenance.content_hash),
        lineCount:
          typeof provenance.line_count === 'number'
            ? provenance.line_count
            : null,
      }
    case 'rollup':
      return {
        origin: 'rollup',
        rule: asString(provenance.rule) ?? 'calculation',
        children: Array.isArray(provenance.children)
          ? provenance.children.flatMap((child) =>
              isRecord(child) &&
              typeof child.qname === 'string' &&
              typeof child.weight === 'number'
                ? [{ qname: child.qname, weight: child.weight }]
                : []
            )
          : [],
      }
    case 'derived':
      return {
        origin: 'derived',
        computation: asString(provenance.computation),
        formula: asString(provenance.formula),
        sourceConcepts: Array.isArray(provenance.source_concepts)
          ? provenance.source_concepts.filter(
              (q): q is string => typeof q === 'string'
            )
          : [],
        amounts: asAmounts(provenance.amounts),
        sources: asSources(provenance.sources),
      }
    default:
      return { origin: 'other', kind: provenance.origin, detail: provenance }
  }
}

/** Whether a figure with this descriptor has something to open. */
export function canDrill(descriptor: FactDescriptor | null): boolean {
  if (descriptor === null) return false
  switch (descriptor.origin) {
    case 'pivot':
      return (
        (descriptor.sources?.length ?? 0) > 0 ||
        descriptor.postingFilter !== null
      )
    case 'rollup':
      return descriptor.children.length > 0
    case 'derived':
      return true
    default:
      return false
  }
}

/** One plain phrase for the construction, for a figure's caption. */
export function originLabel(descriptor: FactDescriptor): string {
  switch (descriptor.origin) {
    case 'pivot':
      return descriptor.sources === null
        ? 'Summed from the lines the flow filter selects'
        : 'Summed from accounts'
    case 'rollup':
      return descriptor.rule === 'net_income'
        ? 'Net income: revenue less expenses'
        : 'Subtotal of the lines beneath it'
    case 'derived':
      return 'Computed'
    default:
      return descriptor.kind
  }
}

/** A computation name as the page says it: `pivot+cash_reconciliation` →
 *  "pivot + cash reconciliation". */
export const partLabel = (name: string): string =>
  name
    .split('+')
    .map((part) => part.replace(/[_:]/g, ' '))
    .join(' + ')
