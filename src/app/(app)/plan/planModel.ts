import type {
  EnvelopeBlock,
  EnvelopeRenderingRow,
} from '../ledger/close/components/blockview/types'

/**
 * The Plan grid's composed model — the workbook's FOP tab as data.
 *
 * Several block envelopes (assumptions/levers, income statement,
 * balance sheet, cash flow) render as stacked sections sharing ONE
 * master column list: the union of every envelope's period ends,
 * chronological, with each section's values mapped into the master
 * columns (null where a section doesn't cover a month — the lever grid
 * spans only the forecast horizon). The actuals/forecast seam rides
 * the server's machine-readable `periods[].forecast` flag.
 */

export interface PlanColumn {
  /** ISO period-end date — the column identity across sections. */
  end: string
  /** Server-composed label ("May 2027 (forecast)") or null = actuals. */
  label: string | null
  forecast: boolean
}

export interface PlanRow {
  key: string
  label: string
  /** Value-domain family for formatting (percent, days, …); null → monetary. */
  itemType: string | null
  isSubtotal: boolean
  depth: number
  /** Aligned to the master columns; null where the section has no value. */
  values: (number | null)[]
}

export interface PlanSection {
  title: string
  rows: PlanRow[]
}

export interface PlanModel {
  columns: PlanColumn[]
  sections: PlanSection[]
}

interface SectionInput {
  title: string
  envelope: EnvelopeBlock | null
}

/** Compose stacked envelopes into one master-column grid. */
export function composePlan(inputs: SectionInput[]): PlanModel {
  // 1) Master columns — union of period ends, chronological (ISO dates
  // sort lexicographically). A column is a forecast column when ANY
  // envelope flags it; the label prefers the first non-null.
  const columnByEnd = new Map<string, PlanColumn>()
  for (const { envelope } of inputs) {
    const periods = envelope?.view.rendering?.periods ?? []
    for (const period of periods) {
      const end = String(period.end)
      const existing = columnByEnd.get(end)
      if (existing) {
        existing.forecast = existing.forecast || period.forecast === true
        existing.label = existing.label ?? period.label ?? null
      } else {
        columnByEnd.set(end, {
          end,
          label: period.label ?? null,
          forecast: period.forecast === true,
        })
      }
    }
  }
  const columns = [...columnByEnd.values()].sort((a, b) =>
    a.end.localeCompare(b.end)
  )
  const indexByEnd = new Map(columns.map((c, i) => [c.end, i]))

  // 2) Sections — each row's values remapped into master-column order.
  const sections: PlanSection[] = []
  for (const { title, envelope } of inputs) {
    const rendering = envelope?.view.rendering
    if (!rendering || rendering.rows.length === 0) continue
    const localIndex: number[] = rendering.periods.map(
      (p) => indexByEnd.get(String(p.end)) ?? -1
    )
    const rows: PlanRow[] = rendering.rows.map(
      (row: EnvelopeRenderingRow, rowIndex: number) => {
        const values: (number | null)[] = columns.map(() => null)
        row.values.forEach((value, i) => {
          const target = localIndex[i]
          if (target >= 0) values[target] = value ?? null
        })
        return {
          key: `${title}:${row.elementId ?? rowIndex}`,
          label: row.elementName ?? row.elementQname ?? String(rowIndex),
          itemType: row.itemType ?? null,
          isSubtotal: row.isSubtotal === true,
          depth: row.depth ?? 0,
          values,
        }
      }
    )
    sections.push({ title, rows })
  }

  return { columns, sections }
}

/** A plan model sliced to a trailing column window, sections in register. */
export function slicePlan(model: PlanModel, start: number): PlanModel {
  if (start <= 0) return model
  return {
    columns: model.columns.slice(start),
    sections: model.sections.map((section) => ({
      ...section,
      rows: section.rows.map((row) => ({
        ...row,
        values: row.values.slice(start),
      })),
    })),
  }
}

/** Serialize the composed grid as CSV — one section-title row per section. */
export function buildPlanCsv(model: PlanModel): string | null {
  if (model.sections.length === 0 || model.columns.length === 0) return null
  const header = ['Line Item', ...model.columns.map((c) => c.label || c.end)]
  const lines = [header.map(csvField).join(',')]
  for (const section of model.sections) {
    lines.push(csvField(section.title))
    for (const row of section.rows) {
      const cells = [
        row.label,
        ...row.values.map((v) =>
          v !== null && v !== undefined ? String(v) : ''
        ),
      ]
      lines.push(cells.map(csvField).join(','))
    }
  }
  return lines.join('\n')
}

function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}
