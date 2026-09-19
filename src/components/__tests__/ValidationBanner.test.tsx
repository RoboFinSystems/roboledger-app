import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('flowbite-react', () => ({
  Badge: ({ children, color }: any) => (
    <span data-testid={`badge-${color}`}>{children}</span>
  ),
}))

vi.mock('react-icons/hi', () => ({
  HiCheckCircle: () => <span data-testid="icon-check" />,
  HiExclamationCircle: () => <span data-testid="icon-warn" />,
  HiMinusCircle: () => <span data-testid="icon-neutral" />,
}))

import ValidationBanner, {
  groupFindings,
  validationStatus,
} from '../ValidationBanner'

describe('validationStatus', () => {
  it('trusts status when present', () => {
    expect(validationStatus({ passed: true, status: 'inconclusive' })).toBe(
      'inconclusive'
    )
    expect(validationStatus({ passed: false, status: 'passed' })).toBe('passed')
  })

  it('falls back to passed when status is missing or unknown', () => {
    expect(validationStatus({ passed: true })).toBe('passed')
    expect(validationStatus({ passed: false, status: null })).toBe('failed')
    expect(validationStatus({ passed: true, status: 'weird' })).toBe('passed')
  })
})

// The cash flow block over a monthly series: the same findings, once a month.
const PLUG = (period: string, plug: string, cash: string): string =>
  `[${period}] Operating cash flow carries a large unattributed reconciling adjustment in 'Other operating capital, net' (${plug} vs operating cash ${cash}) — likely an un-itemized non-cash item; review.`
const ZERO = (period: string, section: string): string =>
  `[${period}] Section 'Cash Provided by (Used in) ${section} Activity' has zero balance`

const MONTHLY_WARNINGS = [
  PLUG('2024-07-31', '-3152.32', '-2641.63'),
  ZERO('2024-07-31', 'Investing'),
  ZERO('2024-07-31', 'Financing'),
  PLUG('2024-08-31', '8148.57', '6009.03'),
  ZERO('2024-08-31', 'Investing'),
  ZERO('2024-08-31', 'Financing'),
  ZERO('2024-09-30', 'Investing'),
  ZERO('2024-09-30', 'Financing'),
]

describe('groupFindings', () => {
  it('collapses per-period repeats into one group per kind of finding', () => {
    const groups = groupFindings(MONTHLY_WARNINGS)
    expect(groups.map((g) => g.messages.length)).toEqual([2, 3, 3])
    expect(groups[1].periods).toEqual([
      '2024-07-31',
      '2024-08-31',
      '2024-09-30',
    ])
  })

  it('treats differing numbers as one kind and elides them from the title', () => {
    const [plug, investing] = groupFindings(MONTHLY_WARNINGS)
    expect(plug.uniform).toBe(false)
    expect(plug.title).toContain('(… vs operating cash …)')
    expect(plug.title).not.toMatch(/\[2024/)
    // Identical text every period: nothing to elide.
    expect(investing.uniform).toBe(true)
    expect(investing.title).toBe(
      "Section 'Cash Provided by (Used in) Investing Activity' has zero balance"
    )
  })

  it('keeps a number that is constant across the group — it is part of the name', () => {
    const [group] = groupFindings([
      "[2025-01-31] 'AWS RI 2024-07 Prepaid' is off by 12.50",
      "[2025-02-28] 'AWS RI 2024-07 Prepaid' is off by 8.25",
    ])
    expect(group.title).toBe("'AWS RI 2024-07 Prepaid' is off by …")
  })

  it('keeps different sections apart even though they share a shape', () => {
    const groups = groupFindings([
      ZERO('2024-07-31', 'Investing'),
      ZERO('2024-07-31', 'Financing'),
    ])
    expect(groups).toHaveLength(2)
  })

  it('leaves unprefixed and one-off findings as they are', () => {
    const groups = groupFindings(['drift > 1%', '[Prior] Does not balance'])
    expect(groups.map((g) => g.messages)).toEqual([
      ['drift > 1%'],
      ['[Prior] Does not balance'],
    ])
    expect(groups[0].periods).toEqual([])
  })
})

describe('ValidationBanner', () => {
  it('renders a green badge for a pass and lists warnings in full', () => {
    render(
      <ValidationBanner
        validation={{
          passed: true,
          status: 'passed',
          failures: [],
          warnings: [
            "[Current] Operating cash flow carries a large unattributed reconciling adjustment in 'Other operating capital, net' (4153.73 vs operating cash -1391.39)",
          ],
        }}
      />
    )
    expect(
      within(screen.getByTestId('badge-success')).getByText(/Validation Passed/)
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId('badge-warning')).getByText('1 warning')
    ).toBeInTheDocument()
    expect(screen.getByText(/Other operating capital/)).toBeInTheDocument()
  })

  it('renders a red badge with the failures for a fail', () => {
    render(
      <ValidationBanner
        validation={{
          passed: false,
          status: 'failed',
          failures: ['[Prior] Balance sheet does not balance'],
          warnings: [],
        }}
      />
    )
    expect(screen.getByTestId('badge-failure')).toBeInTheDocument()
    expect(
      screen.getByText('[Prior] Balance sheet does not balance')
    ).toBeInTheDocument()
    expect(screen.queryByTestId('badge-warning')).toBeNull()
  })

  it('renders a neutral badge — never green — when nothing was checked', () => {
    render(
      <ValidationBanner
        validation={{
          passed: false,
          status: 'inconclusive',
          failures: [],
          warnings: [
            "No validation rules exist for 'equity_statement' — nothing was checked.",
          ],
        }}
      />
    )
    const neutral = screen.getByTestId('badge-gray')
    expect(within(neutral).getByText(/Not validated/)).toBeInTheDocument()
    expect(screen.queryByTestId('badge-success')).toBeNull()
    expect(screen.queryByTestId('badge-failure')).toBeNull()
    // The reason is shown as an explanation, not counted as a data warning.
    expect(screen.queryByTestId('badge-warning')).toBeNull()
    expect(screen.getByText(/nothing was checked/)).toBeInTheDocument()
  })

  it('shows a monthly series as one line per kind, still counting every finding', () => {
    render(
      <ValidationBanner
        validation={{
          passed: true,
          status: 'passed',
          failures: [],
          warnings: MONTHLY_WARNINGS,
        }}
      />
    )
    // The badge counts findings; the list shows kinds.
    expect(
      within(screen.getByTestId('badge-warning')).getByText('8 warnings')
    ).toBeInTheDocument()
    const kinds = screen.getAllByText(/periods$/)
    expect(kinds.map((k) => k.textContent)).toEqual([
      '2 periods',
      '3 periods',
      '3 periods',
    ])

    // The per-period numbers are still there, under the disclosure.
    const plug = screen
      .getByText(/\(… vs operating cash …\)/)
      .closest('details') as HTMLElement
    expect(plug).not.toHaveAttribute('open')
    expect(
      within(plug).getByText(/-3152\.32 vs operating cash -2641\.63/)
    ).toBeInTheDocument()

    // A uniform kind lists just its periods.
    const investing = screen
      .getByText(/Investing Activity' has zero balance/)
      .closest('details') as HTMLElement
    expect(
      within(investing).getByText('2024-07-31, 2024-08-31, 2024-09-30')
    ).toBeInTheDocument()
  })

  it('groups repeated failures the same way', () => {
    render(
      <ValidationBanner
        validation={{
          passed: false,
          status: 'failed',
          failures: [
            '[2024-07-31] Balance sheet does not balance',
            '[2024-08-31] Balance sheet does not balance',
          ],
          warnings: [],
        }}
      />
    )
    expect(
      screen.getByText('Balance sheet does not balance')
    ).toBeInTheDocument()
    expect(screen.getByText('2 periods')).toBeInTheDocument()
  })
})
