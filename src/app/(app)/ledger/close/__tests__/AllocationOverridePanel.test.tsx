import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetAllocationShare = vi.fn()
const mockListAllocationOverrides = vi.fn()
const mockSetAllocationOverride = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      getAllocationShare: (...args: any[]) => mockGetAllocationShare(...args),
      listAllocationOverrides: (...args: any[]) =>
        mockListAllocationOverrides(...args),
      setAllocationOverride: (...args: any[]) =>
        mockSetAllocationOverride(...args),
    },
  },
}))

import { parseDollars } from '@/lib/ledger/formatters'
import AllocationOverridePanel from '../components/AllocationOverridePanel'

const share = (overrides: Record<string, unknown> = {}) => ({
  entityId: 'ent_harbor',
  entityName: 'Harbor Café',
  period: '2026-09',
  consolidationMethod: 'full',
  ownershipPct: 70,
  outsidePct: 30,
  monthResult: 501200,
  proRataAmount: 150360,
  effectiveAmount: 150360,
  closed: false,
  override: null,
  ...overrides,
})

const renderPanel = (period = '2026-09') =>
  render(
    <AllocationOverridePanel
      graphId="kg_a"
      entityId="ent_harbor"
      period={period}
    />
  )

describe('AllocationOverridePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAllocationShare.mockResolvedValue(share())
    mockListAllocationOverrides.mockResolvedValue([])
    mockSetAllocationOverride.mockResolvedValue({})
  })

  it('reads dollars as cents', () => {
    expect(parseDollars('$1,234.5')).toBe(123450)
    expect(parseDollars('-200')).toBe(-20000)
    expect(parseDollars('12.345')).toBeNull()
    expect(parseDollars('abc')).toBeNull()
  })

  it('shows the pro-rata figure the override would replace', async () => {
    renderPanel()
    expect(
      await screen.findByText(
        "Pro rata: 30% of the month's result of $5,012.00, $1,503.60."
      )
    ).toBeInTheDocument()
    expect(mockGetAllocationShare).toHaveBeenCalledWith(
      'kg_a',
      'ent_harbor',
      '2026-09'
    )
    expect(screen.getByText(/No override/)).toBeInTheDocument()
  })

  it('sets an amount with its basis, then re-reads the share', async () => {
    renderPanel()
    fireEvent.click(await screen.findByText('Override the share'))
    const save = screen.getByText('Save override') as HTMLButtonElement
    fireEvent.change(screen.getByLabelText("The outside owners' share ($)"), {
      target: { value: '1,000' },
    })
    expect(save.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('Basis'), {
      target: { value: 'Preferred return' },
    })
    fireEvent.click(save)
    await waitFor(() =>
      expect(mockSetAllocationOverride).toHaveBeenCalledWith('kg_a', {
        entity_id: 'ent_harbor',
        period: '2026-09',
        basis: 'Preferred return',
        amount: 100000,
      })
    )
    await waitFor(() => expect(mockGetAllocationShare).toHaveBeenCalledTimes(2))
  })

  it('sets a percentage, and refuses one over 100', async () => {
    renderPanel()
    fireEvent.click(await screen.findByText('Override the share'))
    fireEvent.click(screen.getByText('Percentage'))
    const input = screen.getByLabelText(
      "The outside owners' share (% of the month's result)"
    )
    fireEvent.change(screen.getByLabelText('Basis'), {
      target: { value: 'Waterfall tier 2' },
    })
    fireEvent.change(input, { target: { value: '120' } })
    const save = screen.getByText('Save override') as HTMLButtonElement
    expect(save.disabled).toBe(true)
    fireEvent.change(input, { target: { value: '25' } })
    fireEvent.click(save)
    await waitFor(() =>
      expect(mockSetAllocationOverride).toHaveBeenCalledWith('kg_a', {
        entity_id: 'ent_harbor',
        period: '2026-09',
        basis: 'Waterfall tier 2',
        percentage: 25,
      })
    )
  })

  it('shows an override and goes back to pro rata', async () => {
    mockGetAllocationShare.mockResolvedValue(
      share({
        override: {
          period: '2026-09',
          amount: null,
          percentage: 25,
          basis: 'Waterfall tier 2',
          setBy: 'usr_1',
        },
        effectiveAmount: 125300,
      })
    )
    mockListAllocationOverrides.mockResolvedValue([
      { period: '2026-08', amount: 90000, percentage: null, basis: 'x' },
      { period: '2026-09', amount: null, percentage: 25, basis: 'y' },
    ])
    renderPanel()
    expect(
      await screen.findByText(
        "Overridden: 25% of the month's result, $1,253.00"
      )
    ).toBeInTheDocument()
    expect(screen.getByText('August 2026: $900.00')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Back to pro rata'))
    await waitFor(() =>
      expect(mockSetAllocationOverride).toHaveBeenCalledWith('kg_a', {
        entity_id: 'ent_harbor',
        period: '2026-09',
        clear: true,
      })
    )
  })

  it('a month the group has closed is read-only', async () => {
    mockGetAllocationShare.mockResolvedValue(share({ closed: true }))
    renderPanel()
    expect(
      await screen.findByText(/The group has closed September 2026/)
    ).toBeInTheDocument()
    expect(screen.queryByText('Override the share')).toBeNull()
  })

  it('a refusal is shown and the form kept', async () => {
    mockSetAllocationOverride.mockRejectedValue(
      new Error(
        'Set allocation override failed: ' +
          JSON.stringify({
            detail:
              'Harbor Café is not a member consolidated in full; only such a member’s outside owners have a share of its result to override.',
          })
      )
    )
    renderPanel()
    fireEvent.click(await screen.findByText('Override the share'))
    fireEvent.change(screen.getByLabelText("The outside owners' share ($)"), {
      target: { value: '10' },
    })
    fireEvent.change(screen.getByLabelText('Basis'), {
      target: { value: 'x' },
    })
    fireEvent.click(screen.getByText('Save override'))
    expect(
      await screen.findByText(/is not a member consolidated in full/)
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
  })

  it('drops an answer for the month it left', async () => {
    let resolveFirst: (value: unknown) => void = () => {}
    mockGetAllocationShare
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveFirst = resolve))
      )
      .mockResolvedValueOnce(share({ period: '2026-10', monthResult: 100 }))
    const { rerender } = renderPanel('2026-09')
    rerender(
      <AllocationOverridePanel
        graphId="kg_a"
        entityId="ent_harbor"
        period="2026-10"
      />
    )
    expect(await screen.findByText(/result of \$1\.00/)).toBeInTheDocument()
    resolveFirst(share())
    await new Promise((r) => setTimeout(r, 0))
    expect(screen.queryByText(/result of \$5,012\.00/)).toBeNull()
  })

  it('hides the month it left while the next one loads', async () => {
    const { rerender } = renderPanel('2026-09')
    expect(await screen.findByText(/result of \$5,012\.00/)).toBeInTheDocument()
    mockGetAllocationShare.mockImplementationOnce(() => new Promise(() => {}))
    rerender(
      <AllocationOverridePanel
        graphId="kg_a"
        entityId="ent_harbor"
        period="2026-10"
      />
    )
    expect(screen.queryByText(/result of \$5,012\.00/)).toBeNull()
    expect(screen.queryByText('Override the share')).toBeNull()
  })

  it('a save left behind by a switch does not lock the next month', async () => {
    const withOverride = share({
      override: {
        period: '2026-09',
        amount: 100000,
        percentage: null,
        basis: 'x',
        setBy: null,
      },
    })
    mockGetAllocationShare.mockResolvedValue(withOverride)
    mockSetAllocationOverride.mockImplementationOnce(
      () => new Promise(() => {})
    )
    const { rerender } = renderPanel('2026-09')
    fireEvent.click(await screen.findByText('Back to pro rata'))
    expect(await screen.findByText('Removing…')).toBeInTheDocument()
    rerender(
      <AllocationOverridePanel
        graphId="kg_a"
        entityId="ent_harbor"
        period="2026-10"
      />
    )
    const back = (await screen.findByText(
      'Back to pro rata'
    )) as HTMLButtonElement
    expect(back.disabled).toBe(false)
  })

  it('takes a percentage only as a plain number', async () => {
    renderPanel()
    fireEvent.click(await screen.findByText('Override the share'))
    fireEvent.click(screen.getByText('Percentage'))
    fireEvent.change(screen.getByLabelText('Basis'), {
      target: { value: 'x' },
    })
    const input = screen.getByLabelText(
      "The outside owners' share (% of the month's result)"
    )
    const save = screen.getByText('Save override') as HTMLButtonElement
    fireEvent.change(input, { target: { value: '1e1' } })
    expect(save.disabled).toBe(true)
    fireEvent.change(input, { target: { value: '12.5' } })
    expect(save.disabled).toBe(false)
  })

  it('offers a retry when the share cannot be read', async () => {
    mockGetAllocationShare
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(share())
    renderPanel()
    fireEvent.click(await screen.findByText('Retry'))
    expect(await screen.findByText(/result of \$5,012\.00/)).toBeInTheDocument()
  })

  it('a month with no allocation says so, with nothing to set', async () => {
    mockGetAllocationShare.mockResolvedValue(null)
    renderPanel('2026-02')
    expect(
      await screen.findByText(
        "No outside owners' share for February 2026: the company was not a member consolidated in full that month."
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('Override the share')).toBeNull()
  })
})
