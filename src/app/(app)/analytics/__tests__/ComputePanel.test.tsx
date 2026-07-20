import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockComputeMetrics = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      computeMetrics: (...args: any[]) => mockComputeMetrics(...args),
    },
  },
}))

vi.mock('flowbite-react', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Spinner: () => <span data-testid="spinner" />,
  TextInput: ({ value, onChange, type }: any) => (
    <input
      data-testid="period-end"
      type={type}
      value={value}
      onChange={onChange}
    />
  ),
}))

vi.mock('react-icons/hi', () => ({
  HiCalculator: () => <span />,
  HiExclamationCircle: () => <span data-testid="icon-error" />,
}))

import ComputePanel from '../components/ComputePanel'

describe('ComputePanel', () => {
  const onComputed = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderPanel = () =>
    render(
      <ComputePanel
        graphId="kg1"
        structureId="struct_metrics"
        onComputed={onComputed}
      />
    )

  it('disables Compute until a period end is picked', () => {
    renderPanel()
    expect(screen.getByText('Compute').closest('button')).toBeDisabled()
  })

  it('computes the period, refetches, and renders the computed/skipped split', async () => {
    mockComputeMetrics.mockResolvedValue({
      structure_id: 'struct_metrics',
      entity_id: 'ent_1',
      period_end: '2026-06-30',
      fact_set_id: 'fs_1',
      computed: [
        {
          rule_id: 'rule_cr',
          element_id: 'elem_cr',
          element_qname: 'rs-metric:CurrentRatio',
          name: 'Current Ratio',
          value: 5.5905,
          unit: 'pure',
          period_type: 'instant',
        },
        {
          rule_id: 'rule_wc',
          element_id: 'elem_wc',
          element_qname: 'rs-metric:WorkingCapital',
          name: 'Working Capital',
          value: 238543.34,
          unit: 'USD',
          period_type: 'instant',
        },
      ],
      skipped: [
        {
          rule_id: 'rule_ic',
          element_qname: 'rs-metric:InterestCoverage',
          reason: 'no facts bound for operand(s)',
          missing: ['rs-gaap:InterestExpense'],
        },
      ],
    })

    renderPanel()
    fireEvent.change(screen.getByTestId('period-end'), {
      target: { value: '2026-06-30' },
    })
    fireEvent.click(screen.getByText('Compute'))

    await waitFor(() =>
      expect(mockComputeMetrics).toHaveBeenCalledWith('kg1', {
        structure_id: 'struct_metrics',
        period_end: '2026-06-30',
      })
    )
    expect(onComputed).toHaveBeenCalled()

    expect(
      await screen.findByText(/Computed 2 metrics for 2026-06-30/)
    ).toBeInTheDocument()
    // Unit-aware result formatting: pure → decimal, USD → dollars
    expect(screen.getByText('5.59')).toBeInTheDocument()
    expect(screen.getByText('$238,543.34')).toBeInTheDocument()
    // The skip is part of the result surface — reason + missing operands
    expect(screen.getByText(/rs-metric:InterestCoverage/)).toBeInTheDocument()
    expect(
      screen.getByText(/missing: rs-gaap:InterestExpense/)
    ).toBeInTheDocument()
  })

  it('surfaces a compute failure without calling onComputed', async () => {
    mockComputeMetrics.mockRejectedValue(new Error('boom'))
    renderPanel()
    fireEvent.change(screen.getByTestId('period-end'), {
      target: { value: '2026-06-30' },
    })
    fireEvent.click(screen.getByText('Compute'))

    expect(
      await screen.findByText('Failed to compute metrics for this period.')
    ).toBeInTheDocument()
    expect(onComputed).not.toHaveBeenCalled()
  })
})
