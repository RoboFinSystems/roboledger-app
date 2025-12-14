import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '../../auth-core/types'
import { AuthGuard } from '../AuthGuard'
import { useAuth } from '../AuthProvider'

// Mock Next.js components and hooks
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />, // eslint-disable-line @next/next/no-img-element
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock auth components and hooks
vi.mock('../AuthProvider', () => ({
  useAuth: vi.fn(),
}))

// Mock UI components
vi.mock('../../ui-components', () => ({
  Spinner: ({ size, fullScreen }: any) => (
    <div data-testid="spinner">
      Loading {size} {fullScreen && '(fullscreen)'}
    </div>
  ),
}))

const mockUseAuth = vi.mocked(useAuth)
const mockUseRouter = vi.mocked(useRouter)

describe('Auth Components - Simple Tests', () => {
  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default router mock
    mockUseRouter.mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as any)
  })

  describe('AuthGuard', () => {
    it('should render children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
        sessionWarning: { show: false, timeLeft: 0 },
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshSession: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        validateResetToken: vi.fn(),
        verifyEmail: vi.fn(),
        resendVerificationEmail: vi.fn(),
      })

      render(
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should show loading spinner when loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        sessionWarning: { show: false, timeLeft: 0 },
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshSession: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        validateResetToken: vi.fn(),
        verifyEmail: vi.fn(),
        resendVerificationEmail: vi.fn(),
      })

      render(
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByTestId('spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading xl (fullscreen)')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should redirect when not authenticated', () => {
      const mockPush = vi.fn()
      mockUseRouter.mockReturnValue({
        push: mockPush,
      } as any)

      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionWarning: { show: false, timeLeft: 0 },
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshSession: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        validateResetToken: vi.fn(),
        verifyEmail: vi.fn(),
        resendVerificationEmail: vi.fn(),
      })

      render(
        <AuthGuard redirectTo="/custom-login">
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      )

      expect(mockPush).toHaveBeenCalledWith('/custom-login')
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should use custom loading component', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        sessionWarning: { show: false, timeLeft: 0 },
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshSession: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        validateResetToken: vi.fn(),
        verifyEmail: vi.fn(),
        resendVerificationEmail: vi.fn(),
      })

      render(
        <AuthGuard
          loadingComponent={
            <div data-testid="custom-loading">Custom Loading</div>
          }
        >
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument()
      expect(screen.getByText('Custom Loading')).toBeInTheDocument()
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should handle router push failure gracefully', () => {
      const mockPush = vi.fn().mockImplementation(() => {
        throw new Error('Router error')
      })

      mockUseRouter.mockReturnValue({
        push: mockPush,
      } as any)

      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionWarning: { show: false, timeLeft: 0 },
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshSession: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        validateResetToken: vi.fn(),
        verifyEmail: vi.fn(),
        resendVerificationEmail: vi.fn(),
      })

      // Silence console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      )

      expect(mockPush).toHaveBeenCalledWith('/login')
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()

      consoleSpy.mockRestore()
    })

    it('should use default redirect path', () => {
      const mockPush = vi.fn()
      mockUseRouter.mockReturnValue({
        push: mockPush,
      } as any)

      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionWarning: { show: false, timeLeft: 0 },
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshSession: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        validateResetToken: vi.fn(),
        verifyEmail: vi.fn(),
        resendVerificationEmail: vi.fn(),
      })

      render(
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      )

      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('should not render anything when not authenticated and not loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionWarning: { show: false, timeLeft: 0 },
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshSession: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        validateResetToken: vi.fn(),
        verifyEmail: vi.fn(),
        resendVerificationEmail: vi.fn(),
      })

      const { container } = render(
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      )

      // Should render null (empty)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Authentication Flow Integration', () => {
    it('should handle authentication state changes', () => {
      const { rerender } = render(
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      )

      // Start with loading
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        sessionWarning: { show: false, timeLeft: 0 },
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshSession: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        validateResetToken: vi.fn(),
        verifyEmail: vi.fn(),
        resendVerificationEmail: vi.fn(),
      })

      rerender(
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByTestId('spinner')).toBeInTheDocument()

      // Then authenticate
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
        sessionWarning: { show: false, timeLeft: 0 },
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshSession: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        validateResetToken: vi.fn(),
        verifyEmail: vi.fn(),
        resendVerificationEmail: vi.fn(),
      })

      rerender(
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      )

      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('should handle logout flow', () => {
      const mockPush = vi.fn()
      mockUseRouter.mockReturnValue({
        push: mockPush,
      } as any)

      const { rerender } = render(
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      )

      // Start authenticated
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
        sessionWarning: { show: false, timeLeft: 0 },
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshSession: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        validateResetToken: vi.fn(),
        verifyEmail: vi.fn(),
        resendVerificationEmail: vi.fn(),
      })

      rerender(
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()

      // Then logout
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionWarning: { show: false, timeLeft: 0 },
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshSession: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        validateResetToken: vi.fn(),
        verifyEmail: vi.fn(),
        resendVerificationEmail: vi.fn(),
      })

      rerender(
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      )

      expect(mockPush).toHaveBeenCalledWith('/login')
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })
})
