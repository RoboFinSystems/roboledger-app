import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetOpenItemsForAgent = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      getOpenItemsForAgent: (...args: any[]) =>
        mockGetOpenItemsForAgent(...args),
    },
  },
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

import OpenBalanceTile, { summarize } from '../OpenBalanceTile'

const item = (openCents: number, daysPastDue: number) => ({
  eventId: `evt_${openCents}`,
  entityId: 'ent_parent',
  agentId: 'agt_acme',
  occurredOn: '2026-08-01',
  documentNumber: null,
  description: null,
  originalCents: openCents,
  settledCents: 0,
  openCents,
  currency: 'USD',
  dueDate: '2026-08-31',
  dueDateBasis: 'stated',
  daysPastDue,
  bucket: 'current',
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('OpenBalanceTile', () => {
  it('shows what the counterparty owes and how late the oldest is', async () => {
    mockGetOpenItemsForAgent.mockImplementation(async (_g, _a, kind) =>
      kind === 'receivables' ? [item(100000, 12), item(20000, -5)] : []
    )
    render(<OpenBalanceTile graphId="kg1" agentId="agt_acme" entityId={null} />)

    expect(await screen.findByText('Owes us')).toBeTruthy()
    expect(screen.getByText('$1,200.00')).toBeTruthy()
    expect(screen.getByText(/oldest 12 days late/)).toBeTruthy()
    expect(screen.queryByText('We owe')).toBeNull()
    expect(mockGetOpenItemsForAgent).toHaveBeenCalledWith(
      'kg1',
      'agt_acme',
      'payables',
      { entityId: null }
    )
  })

  it('shows nothing when both sides are settled, or the read fails', async () => {
    mockGetOpenItemsForAgent.mockRejectedValue(new Error('down'))
    const { container } = render(
      <OpenBalanceTile graphId="kg1" agentId="agt_acme" entityId="ent_sub" />
    )
    await waitFor(() => expect(mockGetOpenItemsForAgent).toHaveBeenCalled())
    expect(container.textContent).toBe('')
  })

  it('summarizes nothing to null', () => {
    expect(summarize('payables', [])).toBeNull()
    expect(summarize('payables', [item(500, -3) as any])?.latestDays).toBe(0)
  })
})
