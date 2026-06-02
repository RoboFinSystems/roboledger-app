import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/core', () => ({ customTheme: { table: {} } }))

vi.mock('flowbite-react', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
}))

import ScheduleRenderingProjection from '../projections/ScheduleRendering'
import { makeEnvelope, makeFact } from './_envelope-fixtures'

describe('ScheduleRenderingProjection', () => {
  const scheduleEnvelope = makeEnvelope({
    blockType: 'schedule',
    name: 'Office Furniture Depreciation',
    elements: [
      {
        id: 'elem_dep',
        qname: 'us-gaap:Depreciation',
        name: 'Depreciation',
        code: null,
        elementType: 'concept',
        isAbstract: false,
        isMonetary: true,
        balanceType: 'debit',
        periodType: 'duration',
      },
    ] as any,
    facts: [
      makeFact({
        id: 'f_jan',
        elementId: 'elem_dep',
        value: 100,
        periodStart: '2026-01-01',
        periodEnd: '2026-01-31',
      }),
      makeFact({
        id: 'f_feb',
        elementId: 'elem_dep',
        value: 100,
        periodStart: '2026-02-01',
        periodEnd: '2026-02-28',
      }),
    ],
  })

  it('shows the empty state when envelope.facts is empty', () => {
    render(
      <ScheduleRenderingProjection
        envelope={makeEnvelope({ blockType: 'schedule', facts: [] })}
      />
    )
    expect(screen.getByText(/No facts found/)).toBeInTheDocument()
  })

  it('groups facts by period and shows period count', () => {
    render(<ScheduleRenderingProjection envelope={scheduleEnvelope} />)
    expect(
      screen.getByText('Office Furniture Depreciation')
    ).toBeInTheDocument()
    expect(screen.getByText('2 periods')).toBeInTheDocument()
  })

  it('looks up element name from envelope.elements per fact', () => {
    render(<ScheduleRenderingProjection envelope={scheduleEnvelope} />)
    const depCells = screen.getAllByText('Depreciation')
    expect(depCells.length).toBe(2) // one row per period
  })

  it('is read-only — renders no per-period Entry action', () => {
    render(<ScheduleRenderingProjection envelope={scheduleEnvelope} />)
    expect(screen.queryByText(/Entry$/)).toBeNull()
  })
})
