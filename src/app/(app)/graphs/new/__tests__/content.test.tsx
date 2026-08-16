import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockOpenCreateGraph = vi.fn()

vi.mock('@/lib/cross-app', () => ({
  useCreateGraphHandoff: () => ({
    openCreateGraph: mockOpenCreateGraph,
    isOpening: false,
  }),
}))

vi.mock('@robosystems/core/auth-core/config', () => ({
  getLoginHomeName: () => 'RoboSystems',
}))

import { NewGraphContent } from '../content'

describe('NewGraphContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOpenCreateGraph.mockResolvedValue(true)
  })

  it('forwards to graph creation on mount, in this tab', async () => {
    render(<NewGraphContent />)

    await waitFor(() => expect(mockOpenCreateGraph).toHaveBeenCalled())
    // Same tab: a window.open on mount has no gesture behind it and would
    // be blocked outright. The clickable affordances pass no argument and
    // get the hook's _blank default instead.
    expect(mockOpenCreateGraph).toHaveBeenCalledWith('_self')
    expect(
      screen.getByText(/Taking you to RoboSystems to create your graph/i)
    ).toBeInTheDocument()
  })

  it('forwards only once under StrictMode double-invoked effects', async () => {
    render(
      <StrictMode>
        <NewGraphContent />
      </StrictMode>
    )

    await waitFor(() => expect(mockOpenCreateGraph).toHaveBeenCalled())
    expect(mockOpenCreateGraph).toHaveBeenCalledTimes(1)
  })

  it('falls back to a retry card when the handoff fails', async () => {
    mockOpenCreateGraph.mockResolvedValue(false)

    render(<NewGraphContent />)

    expect(
      await screen.findByRole('button', { name: /try again/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/Taking you to RoboSystems to create your graph/i)
    ).not.toBeInTheDocument()
  })

  it('retries the handoff from the fallback card', async () => {
    mockOpenCreateGraph.mockResolvedValue(false)
    render(<NewGraphContent />)

    const retry = await screen.findByRole('button', { name: /try again/i })
    mockOpenCreateGraph.mockResolvedValue(true)
    fireEvent.click(retry)

    await waitFor(() => expect(mockOpenCreateGraph).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(
        screen.getByText(/Taking you to RoboSystems to create your graph/i)
      ).toBeInTheDocument()
    )
  })
})
