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

import ValidationBanner, { validationStatus } from '../ValidationBanner'

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
})
