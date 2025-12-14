import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockedClass,
} from 'vitest'
import { RoboSystemsAuthClient } from '../../auth-core/client'
import type { AuthUser } from '../../auth-core/types'
import { AuthProvider, useAuth } from '../AuthProvider'

// Mock the auth client
vi.mock('../../auth-core/client', async () => {
  const actual = (await vi.importActual('../../auth-core/client')) as Record<
    string,
    unknown
  >
  return {
    ...actual,
    RoboSystemsAuthClient: vi.fn(),
  }
})
const MockRoboSystemsAuthClient =
  RoboSystemsAuthClient as unknown as MockedClass<typeof RoboSystemsAuthClient>

// Mock sessionStorage and window methods
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}

const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
})

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
})

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
})

// Test component
const TestComponent = () => {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth()

  return (
    <div>
      <div data-testid="user-id">{user?.id || 'no-user'}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
      <button
        data-testid="login-btn"
        onClick={() => login('test@example.com', 'password')}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => logout()}>
        Logout
      </button>
    </div>
  )
}

const createMockAuthClient = () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  refreshSession: vi.fn(),
  clearAuthCache: vi.fn(),
})

describe('AuthProvider - Simplified Tests', () => {
  let mockAuthClient: ReturnType<typeof createMockAuthClient>

  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  const mockAuthResponse = {
    user: mockUser,
    success: true,
    message: 'Success',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockAddEventListener.mockClear()
    mockRemoveEventListener.mockClear()

    mockAuthClient = createMockAuthClient()

    MockRoboSystemsAuthClient.mockImplementation(
      () => mockAuthClient as unknown as RoboSystemsAuthClient
    )
    mockSessionStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('should handle successful authentication flow', async () => {
    mockAuthClient.getCurrentUser.mockResolvedValueOnce(mockUser)

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('user-123')
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
    })
  })

  it('should handle login successfully', async () => {
    mockAuthClient.getCurrentUser.mockRejectedValueOnce(
      new Error('Not authenticated')
    )
    mockAuthClient.login.mockResolvedValueOnce(mockAuthResponse)

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('login-btn'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
      expect(mockAuthClient.login).toHaveBeenCalledWith(
        'test@example.com',
        'password'
      )
    })
  })

  it('should track user activity', async () => {
    mockAuthClient.getCurrentUser.mockResolvedValueOnce(mockUser)

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
    })

    expect(mockAddEventListener).toHaveBeenCalledWith(
      'mousedown',
      expect.any(Function),
      { passive: true }
    )
    expect(mockAddEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
      { passive: true }
    )
  })

  it('should use cached user data when available', async () => {
    const cachedUser = JSON.stringify({
      ...mockUser,
      cached_at: Date.now(),
      cache_version: '1',
    })
    mockSessionStorage.getItem.mockReturnValue(cachedUser)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Should immediately show user from cache
    expect(screen.getByTestId('user-id')).toHaveTextContent('user-123')
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false')

    // Should validate in background
    await waitFor(() => {
      expect(mockAuthClient.getCurrentUser).toHaveBeenCalled()
    })
  })

  it('should clean up event listeners on unmount', async () => {
    mockAuthClient.getCurrentUser.mockResolvedValueOnce(mockUser)

    const { unmount } = await act(async () => {
      return render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
    })

    act(() => {
      unmount()
    })

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'mousedown',
      expect.any(Function)
    )
    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    )
  })
})
describe('AuthProvider - Force Refresh Tests', () => {
  let mockAuthClient: ReturnType<typeof createMockAuthClient>

  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  const mockAuthResponse = {
    user: mockUser,
    success: true,
    message: 'Success',
  }

  // Test component with refreshSession access
  const RefreshTestComponent = () => {
    const { refreshSession } = useAuth()

    return (
      <div>
        <button
          data-testid="refresh-normal-btn"
          onClick={() => refreshSession().catch(() => {})}
        >
          Refresh Normal
        </button>
        <button
          data-testid="refresh-force-btn"
          onClick={() => refreshSession(true).catch(() => {})}
        >
          Refresh Force
        </button>
      </div>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockAuthClient = createMockAuthClient()

    MockRoboSystemsAuthClient.mockImplementation(
      () => mockAuthClient as unknown as RoboSystemsAuthClient
    )
    mockSessionStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('Refresh Cooldown Behavior', () => {
    it('should enforce 60-second cooldown for normal refresh', async () => {
      mockAuthClient.getCurrentUser.mockResolvedValue(mockUser)
      mockAuthClient.refreshSession.mockResolvedValue(mockAuthResponse)

      await act(async () => {
        render(
          <AuthProvider>
            <RefreshTestComponent />
          </AuthProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('refresh-normal-btn')).toBeInTheDocument()
      })

      // First refresh should work
      await act(async () => {
        fireEvent.click(screen.getByTestId('refresh-normal-btn'))
      })

      await waitFor(() => {
        expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(1)
      })

      // Second refresh within 60s should be blocked
      await act(async () => {
        vi.advanceTimersByTime(30000) // 30 seconds
        fireEvent.click(screen.getByTestId('refresh-normal-btn'))
      })

      // Should still be 1 (blocked by cooldown)
      expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(1)

      // Third refresh after 60s should work
      await act(async () => {
        vi.advanceTimersByTime(31000) // Total 61 seconds
        fireEvent.click(screen.getByTestId('refresh-normal-btn'))
      })

      await waitFor(() => {
        expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(2)
      })
    })

    it('should bypass cooldown when force=true', async () => {
      mockAuthClient.getCurrentUser.mockResolvedValue(mockUser)
      mockAuthClient.refreshSession.mockResolvedValue(mockAuthResponse)

      await act(async () => {
        render(
          <AuthProvider>
            <RefreshTestComponent />
          </AuthProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('refresh-force-btn')).toBeInTheDocument()
      })

      // First normal refresh
      await act(async () => {
        fireEvent.click(screen.getByTestId('refresh-normal-btn'))
      })

      await waitFor(() => {
        expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(1)
      })

      // Forced refresh immediately after should work
      await act(async () => {
        vi.advanceTimersByTime(100) // Only 0.1 seconds later
        fireEvent.click(screen.getByTestId('refresh-force-btn'))
      })

      await waitFor(() => {
        expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(2)
      })

      // Another forced refresh immediately after should also work
      await act(async () => {
        vi.advanceTimersByTime(100)
        fireEvent.click(screen.getByTestId('refresh-force-btn'))
      })

      await waitFor(() => {
        expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(3)
      })
    })

    it('should allow force refresh after failed normal refresh', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      mockAuthClient.getCurrentUser.mockResolvedValue(mockUser)
      mockAuthClient.refreshSession
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockAuthResponse)

      await act(async () => {
        render(
          <AuthProvider>
            <RefreshTestComponent />
          </AuthProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('refresh-normal-btn')).toBeInTheDocument()
      })

      // First refresh fails (error is caught internally)
      await act(async () => {
        fireEvent.click(screen.getByTestId('refresh-normal-btn'))
      })

      await waitFor(() => {
        expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(1)
      })

      // User clicks force refresh immediately (simulating "Stay Logged In" button)
      await act(async () => {
        vi.advanceTimersByTime(100)
        fireEvent.click(screen.getByTestId('refresh-force-btn'))
      })

      await waitFor(() => {
        expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(2)
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Concurrent Refresh Protection', () => {
    it('should prevent concurrent normal refreshes', async () => {
      mockAuthClient.getCurrentUser.mockResolvedValue(mockUser)
      let resolveRefresh: (value: any) => void
      mockAuthClient.refreshSession.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRefresh = resolve
          })
      )

      await act(async () => {
        render(
          <AuthProvider>
            <RefreshTestComponent />
          </AuthProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('refresh-normal-btn')).toBeInTheDocument()
      })

      // Start first refresh (doesn't complete)
      await act(async () => {
        fireEvent.click(screen.getByTestId('refresh-normal-btn'))
      })

      expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(1)

      // Try second refresh while first is in progress
      await act(async () => {
        fireEvent.click(screen.getByTestId('refresh-normal-btn'))
      })

      // Should still be 1 (blocked by refreshInProgress flag)
      expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(1)

      // Complete the first refresh
      await act(async () => {
        resolveRefresh!(mockAuthResponse)
      })

      // Wait for the refresh to complete
      await waitFor(() => {
        expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(1)
      })

      // Advance time past cooldown and try again
      await act(async () => {
        vi.advanceTimersByTime(61000)
        fireEvent.click(screen.getByTestId('refresh-normal-btn'))
      })

      await waitFor(() => {
        expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(2)
      })
    })

    it('should prevent concurrent force refreshes', async () => {
      mockAuthClient.getCurrentUser.mockResolvedValue(mockUser)
      let resolveRefresh: (value: any) => void
      mockAuthClient.refreshSession.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRefresh = resolve
          })
      )

      await act(async () => {
        render(
          <AuthProvider>
            <RefreshTestComponent />
          </AuthProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('refresh-force-btn')).toBeInTheDocument()
      })

      // Start first force refresh (doesn't complete)
      await act(async () => {
        fireEvent.click(screen.getByTestId('refresh-force-btn'))
      })

      expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(1)

      // Try second force refresh while first is in progress
      await act(async () => {
        fireEvent.click(screen.getByTestId('refresh-force-btn'))
      })

      // Should still be 1 (blocked by refreshInProgress flag)
      expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(1)

      // Complete the first refresh
      await act(async () => {
        resolveRefresh!(mockAuthResponse)
      })

      // Now a new force refresh should work
      await act(async () => {
        fireEvent.click(screen.getByTestId('refresh-force-btn'))
      })

      await waitFor(() => {
        expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Error Handling', () => {
    it('should reset refreshInProgress flag after error', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      mockAuthClient.getCurrentUser.mockResolvedValue(mockUser)
      mockAuthClient.refreshSession
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockAuthResponse)

      await act(async () => {
        render(
          <AuthProvider>
            <RefreshTestComponent />
          </AuthProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('refresh-normal-btn')).toBeInTheDocument()
      })

      // First refresh fails (error is caught internally)
      await act(async () => {
        fireEvent.click(screen.getByTestId('refresh-normal-btn'))
      })

      await waitFor(() => {
        expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(1)
      })

      // Second refresh after cooldown should work (flag was reset)
      await act(async () => {
        vi.advanceTimersByTime(61000)
        fireEvent.click(screen.getByTestId('refresh-normal-btn'))
      })

      await waitFor(() => {
        expect(mockAuthClient.refreshSession).toHaveBeenCalledTimes(2)
      })

      consoleErrorSpy.mockRestore()
    })
  })
})
