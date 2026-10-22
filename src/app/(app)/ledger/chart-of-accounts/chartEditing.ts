import type { ElementClassification } from '@/lib/ledger'
import type { UpdateTaxonomyBlockRequest } from '@robosystems/client'
import type { LedgerElement } from '@robosystems/client/clients'

type ElementToAdd = NonNullable<
  UpdateTaxonomyBlockRequest['elements_to_add']
>[number]
type ElementPatch = NonNullable<
  UpdateTaxonomyBlockRequest['elements_to_update']
>[number]

/** One account of the chart being edited, as `update-taxonomy-block` keys it. */
export interface ChartAccount {
  id: string
  qname: string
  code: string | null
  name: string
  classification: ElementClassification
  balanceType: 'debit' | 'credit'
  parentId: string | null
  isActive: boolean
}

/** The entity's own chart: the taxonomy every edit goes to, and its accounts. */
export interface EditableChart {
  taxonomyId: string
  /** The qname prefix new accounts take, e.g. `coa` in `coa:1000`. */
  prefix: string
  accounts: ChartAccount[]
}

/** What the form edits. `parentId` '' is the top level. */
export interface AccountDraft {
  name: string
  code: string
  classification: ElementClassification
  balanceType: 'debit' | 'credit'
  parentId: string
}

const INSTANT: ReadonlySet<ElementClassification> = new Set([
  'asset',
  'liability',
  'equity',
])

export const periodTypeFor = (
  classification: ElementClassification
): 'instant' | 'duration' =>
  INSTANT.has(classification) ? 'instant' : 'duration'

export const normalBalanceFor = (
  classification: ElementClassification
): 'debit' | 'credit' =>
  classification === 'asset' || classification === 'expense'
    ? 'debit'
    : 'credit'

export function toChartAccount(element: LedgerElement): ChartAccount | null {
  if (!element.qname) return null
  return {
    id: element.id,
    qname: element.qname,
    code: element.code,
    name: element.name,
    classification: (element.trait ?? '') as ElementClassification,
    balanceType: element.balanceType === 'credit' ? 'credit' : 'debit',
    parentId: element.parentId,
    isActive: element.isActive,
  }
}

/**
 * The chart the account tree was read from: of the graph's chart taxonomies,
 * the one holding its accounts. Null when none does, or when its accounts
 * came from QuickBooks — a sync owns those, and would undo an edit here.
 */
export function pickEditableChart(
  candidates: { taxonomyId: string; elements: LedgerElement[] }[],
  treeAccountIds: ReadonlySet<string>
): EditableChart | 'synced' | null {
  const match = candidates.find(({ elements }) =>
    elements.some((element) => treeAccountIds.has(element.id))
  )
  if (!match) return null
  if (match.elements.some((element) => element.source !== 'native')) {
    return 'synced'
  }
  const accounts = match.elements
    .map(toChartAccount)
    .filter((account): account is ChartAccount => account !== null)
  const prefix =
    accounts
      .find((account) => account.qname.includes(':'))
      ?.qname.split(':')[0] ?? 'coa'
  return { taxonomyId: match.taxonomyId, prefix, accounts }
}

const slug = (text: string): string =>
  text
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

/** A qname no account of the chart has: the code, else the name, made unique. */
export function newQname(chart: EditableChart, draft: AccountDraft): string {
  const taken = new Set(chart.accounts.map((account) => account.qname))
  const local = slug(draft.code) || slug(draft.name) || 'Account'
  let qname = `${chart.prefix}:${local}`
  for (let n = 2; taken.has(qname); n++) qname = `${chart.prefix}:${local}_${n}`
  return qname
}

export function addPayload(
  chart: EditableChart,
  draft: AccountDraft
): UpdateTaxonomyBlockRequest {
  const parent = chart.accounts.find((account) => account.id === draft.parentId)
  const element: ElementToAdd = {
    qname: newQname(chart, draft),
    name: draft.name.trim(),
    trait: draft.classification,
    balance_type: draft.balanceType,
    period_type: periodTypeFor(draft.classification),
    ...(draft.code.trim() ? { code: draft.code.trim() } : {}),
    ...(parent ? { parent_ref: parent.qname } : {}),
  }
  return { taxonomy_id: chart.taxonomyId, elements_to_add: [element] }
}

/** True when the edit changes what the account is, not only what it's called. */
export const isReclassification = (
  account: ChartAccount,
  draft: AccountDraft
): boolean =>
  draft.classification !== account.classification ||
  draft.balanceType !== account.balanceType

/** The fields that changed, or null when nothing did. */
export function updatePatch(
  chart: EditableChart,
  account: ChartAccount,
  draft: AccountDraft
): ElementPatch | null {
  const patch: ElementPatch = { qname: account.qname }
  const name = draft.name.trim()
  const code = draft.code.trim()
  if (name !== account.name) patch.name = name
  if (code !== (account.code ?? '')) patch.code = code
  if (draft.parentId !== (account.parentId ?? '')) {
    // '' clears the parent, back to the top level.
    patch.parent_ref =
      chart.accounts.find((other) => other.id === draft.parentId)?.qname ?? ''
  }
  if (draft.classification !== account.classification) {
    patch.trait = draft.classification
    if (
      periodTypeFor(draft.classification) !==
      periodTypeFor(account.classification)
    ) {
      patch.period_type = periodTypeFor(draft.classification)
    }
  }
  if (draft.balanceType !== account.balanceType) {
    patch.balance_type = draft.balanceType
  }
  return Object.keys(patch).length > 1 ? patch : null
}

export const activePatch = (
  chart: EditableChart,
  account: ChartAccount,
  isActive: boolean
): UpdateTaxonomyBlockRequest => ({
  taxonomy_id: chart.taxonomyId,
  elements_to_update: [{ qname: account.qname, is_active: isActive }],
})

/**
 * Accounts the edited one may sit under: active, of its classification, and
 * neither itself nor anything beneath it, which would make a cycle.
 */
export function parentOptions(
  chart: EditableChart,
  classification: ElementClassification,
  editing: ChartAccount | null
): ChartAccount[] {
  const below = new Set<string>()
  if (editing) {
    below.add(editing.id)
    let grew = true
    while (grew) {
      grew = false
      for (const account of chart.accounts) {
        if (
          account.parentId &&
          below.has(account.parentId) &&
          !below.has(account.id)
        ) {
          below.add(account.id)
          grew = true
        }
      }
    }
  }
  return chart.accounts
    .filter(
      (account) =>
        account.isActive &&
        account.classification === classification &&
        !below.has(account.id)
    )
    .sort((a, b) =>
      (a.code ?? a.name).localeCompare(b.code ?? b.name, undefined, {
        numeric: true,
      })
    )
}

/** Another active account already using the code, if any. */
export const codeTakenBy = (
  chart: EditableChart,
  code: string,
  editing: ChartAccount | null
): ChartAccount | null => {
  const wanted = code.trim()
  if (!wanted) return null
  return (
    chart.accounts.find(
      (account) =>
        account.code === wanted &&
        account.id !== editing?.id &&
        account.isActive
    ) ?? null
  )
}
