import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/image', () => ({
  default: ({ alt }: any) => <span>{alt}</span>,
}))

vi.mock('@robosystems/core/ui', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Button: ({ children, onClick, disabled, title }: any) => (
    <button onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  Progress: () => <div />,
  Select: ({ children, ...rest }: any) => <select {...rest}>{children}</select>,
}))

vi.mock('../components/FiscalCalendarBootstrap', () => ({
  FiscalCalendarBootstrap: ({ entityId, entityName }: any) => (
    <div>
      calendar-bootstrap:{entityId ?? 'parent'}:{entityName}
    </div>
  ),
}))

import ConnectionCard, {
  type ConnectionData,
} from '../components/ConnectionCard'

const connection = (
  overrides: Partial<ConnectionData> = {}
): ConnectionData => ({
  connection_id: 'conn_1',
  provider: 'mercury',
  status: 'connected',
  created_at: '2026-09-12T00:00:00Z',
  metadata: {},
  ...overrides,
})

describe('ConnectionCard', () => {
  it('a QuickBooks card chooses write back or shadow, never native', () => {
    const onSetWritePolicy = vi.fn()
    const { container } = render(
      <ConnectionCard
        connection={connection({
          provider: 'quickbooks',
          write_policy: 'qb_authoritative',
        })}
        status={{ status: 'connected', message: 'Connected' }}
        onSync={() => {}}
        onDelete={() => {}}
        onSetWritePolicy={onSetWritePolicy}
        graphId="kg_test"
      />
    )
    const select = container.querySelector('select') as HTMLSelectElement
    expect(Array.from(select.options).map((o) => o.value)).toEqual([
      'qb_authoritative',
      'shadow',
    ])
    fireEvent.change(select, { target: { value: 'shadow' } })
    expect(onSetWritePolicy).toHaveBeenCalledWith('shadow')
  })

  it('a row still on native shows it until another choice is made', () => {
    const { container } = render(
      <ConnectionCard
        connection={connection({
          provider: 'quickbooks',
          write_policy: 'native',
        })}
        status={{ status: 'connected', message: 'Connected' }}
        onSync={() => {}}
        onDelete={() => {}}
        onSetWritePolicy={() => {}}
        graphId="kg_test"
      />
    )
    const select = container.querySelector('select') as HTMLSelectElement
    expect(select.value).toBe('native')
    expect(Array.from(select.options).map((o) => o.value)).toEqual([
      'qb_authoritative',
      'shadow',
      'native',
    ])
  })

  it('offers Continue sign-in instead of Sync while OAuth is pending', () => {
    const onContinueOAuth = vi.fn()
    const onSync = vi.fn()
    render(
      <ConnectionCard
        connection={connection({ status: 'pending_oauth' })}
        status={{ status: 'pending_oauth', message: 'Sign-in not finished' }}
        onSync={onSync}
        onDelete={() => {}}
        onContinueOAuth={onContinueOAuth}
        graphId="kg_test"
      />
    )
    fireEvent.click(screen.getByText('Continue sign-in'))
    expect(onContinueOAuth).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Sync Now')).toBeNull()
    expect(onSync).not.toHaveBeenCalled()
  })

  it('holds the calendar bootstrap until the provider has granted access', () => {
    render(
      <ConnectionCard
        connection={connection({ status: 'pending_oauth' })}
        status={{ status: 'pending_oauth', message: 'Sign-in not finished' }}
        onSync={() => {}}
        onDelete={() => {}}
        graphId="kg_test"
      />
    )
    expect(screen.queryByText('calendar-bootstrap')).toBeNull()
  })

  it('shows Sync and the calendar bootstrap once connected', () => {
    render(
      <ConnectionCard
        connection={connection()}
        status={{ status: 'connected', message: 'Connected' }}
        onSync={() => {}}
        onDelete={() => {}}
        graphId="kg_test"
        feedEntities={[{ entityId: null, name: 'Harbor Holdings' }]}
      />
    )
    expect(screen.getByText('Sync Now')).toBeTruthy()
    expect(
      screen.getByText('calendar-bootstrap:parent:Harbor Holdings')
    ).toBeTruthy()
    expect(screen.queryByText('Continue sign-in')).toBeNull()
  })

  it('a feed names, and checks the calendar of, each entity its accounts book to', () => {
    render(
      <ConnectionCard
        connection={connection({ provider: 'plaid' })}
        status={{ status: 'connected', message: 'Connected' }}
        onSync={() => {}}
        onDelete={() => {}}
        graphId="kg_test"
        feedEntities={[
          { entityId: null, name: 'Harbor Holdings' },
          { entityId: 'ent_sub', name: 'Cadence Studio' },
        ]}
      />
    )
    expect(
      screen.getByText('Books to: Harbor Holdings, Cadence Studio')
    ).toBeTruthy()
    expect(
      screen.getByText('calendar-bootstrap:parent:Harbor Holdings')
    ).toBeTruthy()
    expect(
      screen.getByText('calendar-bootstrap:ent_sub:Cadence Studio')
    ).toBeTruthy()
  })

  it("a QuickBooks card checks the parent's calendar, whose books it keeps", () => {
    render(
      <ConnectionCard
        connection={connection({ provider: 'quickbooks' })}
        status={{ status: 'connected', message: 'Connected' }}
        onSync={() => {}}
        onDelete={() => {}}
        graphId="kg_test"
        parentName="Harbor Holdings"
      />
    )
    expect(
      screen.getByText('calendar-bootstrap:parent:Harbor Holdings')
    ).toBeTruthy()
    expect(screen.queryByText(/Books to:/)).toBeNull()
  })
})
