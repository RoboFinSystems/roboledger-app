import type { EnvelopeBlock } from '../../ledger/close/components/blockview/types'

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

/** Quote a CSV field when it contains a delimiter, quote, or newline. */
function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Trigger a browser download of CSV content. */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/** Filesystem-safe filename from a block name. */
export function csvFilename(blockName: string): string {
  const slug = blockName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug || 'information-block'}.csv`
}
