import type { EnvelopeBlock } from '../../ledger/close/components/blockview/types'

/**
 * Serializers for the grid surfaces (Block Explorer, Plan) plus the
 * download plumbing they share. CSV is the spreadsheet handoff; JSON
 * keeps what a flat grid drops — the per-period forecast flag (the
 * actuals/forecast seam), row depth, subtotal shape, and the value
 * domain used for formatting.
 */

/**
 * Serialize a block's server-computed rendering (rows × periods) as
 * CSV. Works on any block type — one label column plus one column per
 * period, values raw (unformatted) so spreadsheets can aggregate them.
 * Returns null when the envelope has no rendering to export.
 */
export function buildRenderingCsv(envelope: EnvelopeBlock): string | null {
  const rendering = envelope.view.rendering
  if (!rendering || rendering.rows.length === 0) {
    return null
  }

  const header = [
    'Line Item',
    ...rendering.periods.map(
      (period, i) => period.label || period.end || `Period ${i + 1}`
    ),
  ]

  const lines = [header.map(csvField).join(',')]
  for (const row of rendering.rows) {
    const cells = [
      row.elementName,
      ...rendering.periods.map((_, i) => {
        const value = row.values[i]
        return value !== null && value !== undefined ? String(value) : ''
      }),
    ]
    lines.push(cells.map(csvField).join(','))
  }
  return lines.join('\n')
}

/**
 * The same rendering as JSON: block identity, periods (seam flag
 * intact), and rows keyed by element with their classification and
 * hierarchy — the machine-readable flavor for scripts and notebooks.
 */
export function buildRenderingJson(envelope: EnvelopeBlock): string | null {
  const rendering = envelope.view.rendering
  if (!rendering || rendering.rows.length === 0) {
    return null
  }

  return JSON.stringify(
    {
      block: {
        id: envelope.id,
        name: envelope.displayName ?? envelope.name ?? null,
        blockType: envelope.blockType ?? null,
      },
      periods: rendering.periods.map((period) => ({
        start: period.start ?? null,
        end: period.end ?? null,
        label: period.label ?? null,
        forecast: period.forecast === true,
      })),
      rows: rendering.rows.map((row) => ({
        elementId: row.elementId ?? null,
        elementQname: row.elementQname ?? null,
        label: row.elementName ?? null,
        itemType: row.itemType ?? null,
        classification: row.classification ?? null,
        balanceType: row.balanceType ?? null,
        isSubtotal: row.isSubtotal === true,
        depth: row.depth ?? 0,
        values: row.values.map((value) => value ?? null),
      })),
    },
    null,
    2
  )
}

/** Quote a CSV field when it contains a delimiter, quote, or newline. */
export function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Trigger a browser download of text content. */
export function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/** Trigger a browser download of CSV content. */
export function downloadCsv(csv: string, filename: string): void {
  downloadTextFile(csv, filename, 'text/csv;charset=utf-8')
}

/** Trigger a browser download of JSON content. */
export function downloadJson(json: string, filename: string): void {
  downloadTextFile(json, filename, 'application/json;charset=utf-8')
}

/** Filesystem-safe filename from a display name plus an extension. */
export function exportFilename(
  name: string,
  extension: string,
  fallback = 'information-block'
): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug || fallback}.${extension}`
}

/** Filesystem-safe CSV filename from a block name. */
export function csvFilename(blockName: string): string {
  return exportFilename(blockName, 'csv')
}
