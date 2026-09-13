import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/image', () => ({
  default: ({ alt }: any) => <span>{alt}</span>,
}))

vi.mock('flowbite-react', () => ({
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
  FiscalCalendarBootstrap: () => <div>calendar-bootstrap</div>,
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
      />
    )
    expect(screen.getByText('Sync Now')).toBeTruthy()
    expect(screen.getByText('calendar-bootstrap')).toBeTruthy()
    expect(screen.queryByText('Continue sign-in')).toBeNull()
  })
})
