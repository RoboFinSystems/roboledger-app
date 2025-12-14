import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../AuthProvider'
import { SessionWarningDialog } from '../SessionWarningDialog'

vi.mock('../AuthProvider', () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

describe('SessionWarningDialog', () => {
  const mockRefreshSession = vi.fn()
  const mockLogout = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockUseAuth.mockReturnValue({
      sessionWarning: { show: false, timeLeft: 0 },
      refreshSession: mockRefreshSession,
      logout: mockLogout,
    })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('Dialog Visibility', () => {
    it('should not render when sessionWarning.show is false', () => {
      render(<SessionWarningDialog />)
      expect(
        screen.queryByText('Session Expiring Soon')
      ).not.toBeInTheDocument()
    })

    it('should render when sessionWarning.show is true', () => {
      mockUseAuth.mockReturnValue({
        sessionWarning: { show: true, timeLeft: 300 },
        refreshSession: mockRefreshSession,
        logout: mockLogout,
      })

      render(<SessionWarningDialog />)
      expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument()
    })
  })

  describe('Countdown Display', () => {
    it('should display countdown in minutes and seconds', () => {
      mockUseAuth.mockReturnValue({
        sessionWarning: { show: true, timeLeft: 125 },
        refreshSession: mockRefreshSession,
        logout: mockLogout,
      })

      render(<SessionWarningDialog />)
      expect(screen.getByText('2m 5s')).toBeInTheDocument()
    })

    it('should display countdown in seconds only when under 1 minute', () => {
      mockUseAuth.mockReturnValue({
        sessionWarning: { show: true, timeLeft: 45 },
        refreshSession: mockRefreshSession,
        logout: mockLogout,
      })

      render(<SessionWarningDialog />)
      expect(screen.getByText('45s')).toBeInTheDocument()
    })

    it('should decrement countdown every second', async () => {
      mockUseAuth.mockReturnValue({
        sessionWarning: { show: true, timeLeft: 60 },
        refreshSession: mockRefreshSession,
        logout: mockLogout,
      })

      render(<SessionWarningDialog />)
      expect(screen.getByText('1m 0s')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByText('59s')).toBeInTheDocument()
      })
    })
  })

  describe('Auto-Logout on Countdown Complete', () => {
    it('should call logout when countdown reaches 0', async () => {
      mockUseAuth.mockReturnValue({
        sessionWarning: { show: true, timeLeft: 2 },
        refreshSession: mockRefreshSession,
        logout: mockLogout,
      })

      render(<SessionWarningDialog />)

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1)
      })
    })

    it('should not logout if countdown is stopped before reaching 0', () => {
      const { rerender } = render(<SessionWarningDialog />)

      mockUseAuth.mockReturnValue({
        sessionWarning: { show: true, timeLeft: 5 },
        refreshSession: mockRefreshSession,
        logout: mockLogout,
      })

      rerender(<SessionWarningDialog />)

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // Close the dialog
      mockUseAuth.mockReturnValue({
        sessionWarning: { show: false, timeLeft: 0 },
        refreshSession: mockRefreshSession,
        logout: mockLogout,
      })

      rerender(<SessionWarningDialog />)

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(mockLogout).not.toHaveBeenCalled()
    })
  })

  describe('User Actions', () => {
    it('should call refreshSession with force=true when "Stay Logged In" is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      mockRefreshSession.mockResolvedValue(undefined)
      mockUseAuth.mockReturnValue({
        sessionWarning: { show: true, timeLeft: 300 },
        refreshSession: mockRefreshSession,
        logout: mockLogout,
      })

      render(<SessionWarningDialog />)

      const stayLoggedInButton = screen.getByText('Stay Logged In')
      await user.click(stayLoggedInButton)

      expect(mockRefreshSession).toHaveBeenCalledWith(true)
      expect(mockRefreshSession).toHaveBeenCalledTimes(1)
    })

    it('should show loading state while refreshing', async () => {
      const user = userEvent.setup({ delay: null })
      let resolveRefresh: () => void
      mockRefreshSession.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRefresh = resolve as () => void
          })
      )
      mockUseAuth.mockReturnValue({
        sessionWarning: { show: true, timeLeft: 300 },
        refreshSession: mockRefreshSession,
        logout: mockLogout,
      })

      render(<SessionWarningDialog />)

      const stayLoggedInButton = screen.getByText('Stay Logged In')
      await user.click(stayLoggedInButton)

      expect(screen.getByText('Refreshing...')).toBeInTheDocument()
      expect(stayLoggedInButton).toBeDisabled()

      act(() => {
        resolveRefresh!()
      })

      await waitFor(() => {
        expect(screen.getByText('Stay Logged In')).toBeInTheDocument()
      })
    })

    it('should call logout when "Logout" button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      mockLogout.mockResolvedValue(undefined)
      mockUseAuth.mockReturnValue({
        sessionWarning: { show: true, timeLeft: 300 },
        refreshSession: mockRefreshSession,
        logout: mockLogout,
      })

      render(<SessionWarningDialog />)

      const logoutButton = screen.getByText('Logout')
      await user.click(logoutButton)

      expect(mockLogout).toHaveBeenCalledTimes(1)
    })

    it('should handle refresh errors gracefully', async () => {
      const user = userEvent.setup({ delay: null })
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      mockRefreshSession.mockRejectedValue(new Error('Network error'))
      mockUseAuth.mockReturnValue({
        sessionWarning: { show: true, timeLeft: 300 },
        refreshSession: mockRefreshSession,
        logout: mockLogout,
      })

      render(<SessionWarningDialog />)

      const stayLoggedInButton = screen.getByText('Stay Logged In')
      await user.click(stayLoggedInButton)

      // After error, should go back to normal state
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to refresh session:',
          expect.any(Error)
        )
        expect(screen.getByText('Stay Logged In')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Dialog Content', () => {
    it('should display correct warning message', () => {
      mockUseAuth.mockReturnValue({
        sessionWarning: { show: true, timeLeft: 300 },
        refreshSession: mockRefreshSession,
        logout: mockLogout,
      })

      render(<SessionWarningDialog />)

      expect(
        screen.getByText(/Your session will expire in/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Would you like to stay logged in?/i)
      ).toBeInTheDocument()
    })

    it('should display both action buttons', () => {
      mockUseAuth.mockReturnValue({
        sessionWarning: { show: true, timeLeft: 300 },
        refreshSession: mockRefreshSession,
        logout: mockLogout,
      })

      render(<SessionWarningDialog />)

      expect(screen.getByText('Stay Logged In')).toBeInTheDocument()
      expect(screen.getByText('Logout')).toBeInTheDocument()
    })
  })

  describe('Countdown Updates', () => {
    it('should update countdown when timeLeft prop changes', async () => {
      const { rerender } = render(<SessionWarningDialog />)

      mockUseAuth.mockReturnValue({
        sessionWarning: { show: true, timeLeft: 100 },
        refreshSession: mockRefreshSession,
        logout: mockLogout,
      })

      rerender(<SessionWarningDialog />)
      expect(screen.getByText('1m 40s')).toBeInTheDocument()
      mockUseAuth.mockReturnValue({
        sessionWarning: { show: true, timeLeft: 50 },
        refreshSession: mockRefreshSession,
        logout: mockLogout,
      })

      rerender(<SessionWarningDialog />)
      expect(screen.getByText('50s')).toBeInTheDocument()
    })
  })
})
