import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import WorksheetTable, { columnCaption } from '../components/WorksheetTable'

const column = (over: Record<string, unknown>) =>
  ({ key: 'k', label: 'L', kind: 'member', in_sum: true, ...over }) as any

const worksheet = {
  graph_id: 'kg_a',
  entity_id: 'ent_p',
  statement_type: 'balance_sheet',
  period: { start: '2026-08-01', end: '2026-08-31', label: 'Current' },
  columns: [
    column({ key: 'ent_p', label: 'Driftline', consolidation_method: 'full' }),
    column({
      key: 'ent_h',
      label: 'Harbor',
      consolidation_method: 'full',
      ownership_pct: 70,
    }),
    column({ key: 'combined', label: 'Combined', kind: 'combined' }),
    column({ key: 'ent_c', label: 'Adjustments', kind: 'adjustments' }),
    column({
      key: 'consolidated',
      label: 'Consolidated',
      kind: 'consolidated',
    }),
    column({
      key: 'ent_k',
      label: 'Kiosk',
      kind: 'not_summed',
      in_sum: false,
      consolidation_method: 'equity',
      ownership_pct: 40,
    }),
  ],
  rows: [
    {
      qname: 'rs-gaap:Cash',
      name: 'Cash',
      depth: 1,
      values: [100, 50, 150, 0, 150, 30],
    },
  ],
} as any

describe('WorksheetTable', () => {
  it('names each column and lays the values out under it', () => {
    render(<WorksheetTable worksheet={worksheet} />)
    const table = screen.getByTestId('worksheet-table')
    for (const label of [
      'Driftline',
      'Harbor',
      'Combined',
      'Consolidated',
      'Kiosk',
    ]) {
      expect(within(table).getByText(label)).toBeInTheDocument()
    }
    const row = within(table).getByText('Cash').closest('tr')!
    expect(row.textContent).toContain('$150.00')
    expect(row.textContent).toContain('$30.00')
  })

  it('says how each column is treated', () => {
    const [parent, harbor, combined, adjustments, consolidated, kiosk] =
      worksheet.columns
    expect(columnCaption(parent)).toBe('Parent')
    expect(columnCaption(harbor)).toBe('In full · 70%')
    expect(columnCaption(combined)).toBe('Members summed')
    expect(columnCaption(adjustments)).toBe('Eliminations and NCI')
    expect(columnCaption(consolidated)).toBe('The group')
    expect(columnCaption(kiosk)).toBe('Equity method · 40%')
  })
})
