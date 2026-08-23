import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import RefreshControl from '../RefreshControl'

describe('RefreshControl', () => {
  it('renders the last-fetched label and hands clicks to onRefresh', () => {
    const onRefresh = vi.fn()
    render(
      <RefreshControl
        onRefresh={onRefresh}
        isRefreshing={false}
        fetchedAt={new Date()}
      />
    )

    expect(screen.getByTestId('fetched-at')).toHaveTextContent(
      'Fetched just now'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('hides the label until a successful fetch', () => {
    render(
      <RefreshControl
        onRefresh={vi.fn()}
        isRefreshing={false}
        fetchedAt={null}
      />
    )
    expect(screen.queryByTestId('fetched-at')).not.toBeInTheDocument()
  })

  it('disables the button while refreshing', () => {
    render(
      <RefreshControl onRefresh={vi.fn()} isRefreshing fetchedAt={new Date()} />
    )
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled()
  })
})
