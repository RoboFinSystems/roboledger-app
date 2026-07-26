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
  /**
   * True for the scenario's own lever/assertion grid. Assumptions are
   * assertions ABOUT the future — they only mean anything in forecast
   * columns, so their values are masked everywhere else UNLESS the
   * envelope marks its own seam (see `marksItsOwnSeam`).
   */
  forecastOnly?: boolean
}

/**
 * Whether a rendering carries the machine-readable seam itself.
 *
 * The forecast block's envelope used to render the horizon alone with
 * `forecast` unset on every period; a scenario authored months ago
 * therefore carried lever values for months that have since closed, and
 * those had to be masked here (an assertion is not a description of
 * history). The envelope now spans the closed months too, with each
 * lever's rule inverted against the month's actuals — realized rates
 * behind the seam — and marks its forward columns `forecast: true`.
 *
 * That flag is the version probe: its presence means the values in the
 * unflagged columns are realized, not stale, so they render as-is.
 */
const marksItsOwnSeam = (envelope: EnvelopeBlock | null): boolean =>
  (envelope?.view.rendering?.periods ?? []).some((p) => p.forecast === true)

/** Compose stacked envelopes into one master-column grid. */
export function composePlan(inputs: SectionInput[]): PlanModel {
  // 1) Master columns — union of period ends, chronological (ISO dates
  // sort lexicographically). A column is a forecast column when ANY
  // envelope flags it; the label prefers the first non-null.
  const columnByEnd = new Map<string, PlanColumn>()
  // Ends that a statement covers as an ACTUAL period. The lever grid is
  // excluded on purpose: the forecast block renders base_period+1 …
  // +horizon with `forecast` unset (the flag only rides scenario
  // FactSet columns), so counting its months here would read a forward
  // month as history.
  const actualEnds = new Set<string>()
  for (const { envelope, forecastOnly } of inputs) {
    const periods = envelope?.view.rendering?.periods ?? []
    for (const period of periods) {
      const end = String(period.end)
      const isForecast = period.forecast === true
      if (!forecastOnly && !isForecast) actualEnds.add(end)
      const existing = columnByEnd.get(end)
      if (existing) {
        existing.forecast = existing.forecast || isForecast
        existing.label = existing.label ?? period.label ?? null
      } else {
        columnByEnd.set(end, {
          end,
          label: period.label ?? null,
          forecast: isForecast,
        })
      }
    }
  }
  // A column with no actual behind it is forward even when nothing
  // flagged it — the scenario-only months you get before
  // compute-forecast has stamped statements for the horizon.
  for (const column of columnByEnd.values()) {
    column.forecast = column.forecast || !actualEnds.has(column.end)
  }
  const columns = [...columnByEnd.values()].sort((a, b) =>
    a.end.localeCompare(b.end)
  )
  const indexByEnd = new Map(columns.map((c, i) => [c.end, i]))

  // 2) Sections — each row's values remapped into master-column order.
  const sections: PlanSection[] = []
  for (const { title, envelope, forecastOnly } of inputs) {
    const rendering = envelope?.view.rendering
    if (!rendering || rendering.rows.length === 0) continue
    // Mask only what the server hasn't already resolved: an envelope
    // that marks its own seam has realized values behind it.
    const mask = forecastOnly === true && !marksItsOwnSeam(envelope)
    const localIndex: number[] = rendering.periods.map(
      (p) => indexByEnd.get(String(p.end)) ?? -1
    )
    const rows: PlanRow[] = rendering.rows.map(
      (row: EnvelopeRenderingRow, rowIndex: number) => {
        const values: (number | null)[] = columns.map(() => null)
        row.values.forEach((value, i) => {
          const target = localIndex[i]
          if (target < 0) return
          // A scenario whose horizon started before today still carries
          // lever values for months that have since closed — those are
          // history now, and the assumption never applied to them.
          if (mask && !columns[target].forecast) return
          values[target] = value ?? null
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
    // Masking can empty a lever row entirely (a fully elapsed horizon);
    // an all-blank assumptions block is noise, not information.
    const kept = mask
      ? rows.filter((row) => row.values.some((value) => value !== null))
      : rows
    if (kept.length === 0) continue
    sections.push({ title, rows: kept })
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

/**
 * A plan model sliced by TWO windows split at the seam: the history
 * window keeps the most recent N actual columns (you look back from
 * today), the forecast window keeps the FIRST N forecast columns (you
 * look forward from the seam). A single trailing window over the
 * composed series gets this wrong the moment a scenario is selected —
 * "3M" would keep the far tail of the forecast and drop every actual.
 * 'all' on either side keeps that side whole.
 */
export function slicePlanSeam(
  model: PlanModel,
  history: 'all' | number,
  forecast: 'all' | number
): PlanModel {
  const historyIdx: number[] = []
  const forecastIdx: number[] = []
  model.columns.forEach((column, i) =>
    (column.forecast ? forecastIdx : historyIdx).push(i)
  )
  const keptHistory =
    history === 'all'
      ? historyIdx
      : historyIdx.slice(Math.max(0, historyIdx.length - history))
  const keptForecast =
    forecast === 'all' ? forecastIdx : forecastIdx.slice(0, forecast)
  const kept = [...keptHistory, ...keptForecast].sort((a, b) => a - b)
  if (kept.length === model.columns.length) return model
  return {
    columns: kept.map((i) => model.columns[i]),
    sections: model.sections.map((section) => ({
      ...section,
      rows: section.rows.map((row) => ({
        ...row,
        values: kept.map((i) => row.values[i]),
      })),
    })),
  }
}

export interface PlanExportMeta {
  entityName: string | null
  /** Selected scenario's instance name; null = the actuals view. */
  scenarioName: string | null
}

/**
 * Serialize the composed grid as JSON — the same numbers CSV carries
 * plus what a flat grid drops: the per-column forecast flag (the seam
 * itself), each row's subtotal/depth shape, and the value domain used
 * for formatting. Returns null when there's nothing to export.
 */
export function buildPlanJson(
  model: PlanModel,
  meta: PlanExportMeta
): string | null {
  if (model.sections.length === 0 || model.columns.length === 0) return null
  return JSON.stringify(
    {
      entity: meta.entityName,
      scenario: meta.scenarioName,
      columns: model.columns.map((column) => ({
        end: column.end,
        label: column.label,
        forecast: column.forecast,
      })),
      sections: model.sections.map((section) => ({
        title: section.title,
        rows: section.rows.map((row) => ({
          label: row.label,
          itemType: row.itemType,
          isSubtotal: row.isSubtotal,
          depth: row.depth,
          values: row.values,
        })),
      })),
    },
    null,
    2
  )
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
