import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockOpenLoginHome = vi.fn()

vi.mock('@robosystems/core/hooks', () => ({
  useCrossAppLink: () => ({
    openApp: vi.fn(),
    openLoginHome: mockOpenLoginHome,
    isOpening: false,
  }),
}))

vi.mock('@robosystems/core/auth-core/config', () => ({
  getLoginHomeName: () => 'RoboSystems',
}))

vi.mock('@robosystems/core/ui-components/layout', () => ({
  ACCOUNT_SETTINGS_PATH: '/settings',
}))

import { UserSettingsContent } from '../content'

describe('UserSettingsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOpenLoginHome.mockResolvedValue(true)
  })

  it('forwards to the login home on mount, in this tab', async () => {
    render(<UserSettingsContent />)

    await waitFor(() => expect(mockOpenLoginHome).toHaveBeenCalled())
    // Same tab: a window.open on mount has no gesture behind it and would
    // be blocked outright.
    expect(mockOpenLoginHome).toHaveBeenCalledWith({
      path: '/settings',
      target: '_self',
    })
    expect(
      screen.getByText(/Taking you to your RoboSystems account settings/i)
    ).toBeInTheDocument()
  })

  it('forwards only once under StrictMode double-invoked effects', async () => {
    // StrictMode mounts, unmounts and remounts in dev. Without the ref guard
    // that is two SSO exchanges for one page load.
    render(
      <StrictMode>
        <UserSettingsContent />
      </StrictMode>
    )

    await waitFor(() => expect(mockOpenLoginHome).toHaveBeenCalled())
    expect(mockOpenLoginHome).toHaveBeenCalledTimes(1)
  })

  it('falls back to a retry card when the handoff fails', async () => {
    mockOpenLoginHome.mockResolvedValue(false)

    render(<UserSettingsContent />)

    // No dead spinner — the user gets something to act on.
    expect(
      await screen.findByRole('button', { name: /try again/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/Taking you to your RoboSystems account settings/i)
    ).not.toBeInTheDocument()
    expect(screen.getByText(/managed on the RoboSystems/i)).toBeInTheDocument()
  })

  it('retries the handoff from the fallback card', async () => {
    mockOpenLoginHome.mockResolvedValue(false)
    render(<UserSettingsContent />)

    const retry = await screen.findByRole('button', { name: /try again/i })
    mockOpenLoginHome.mockResolvedValue(true)
    fireEvent.click(retry)

    await waitFor(() => expect(mockOpenLoginHome).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(
        screen.getByText(/Taking you to your RoboSystems account settings/i)
      ).toBeInTheDocument()
    )
  })
})
