import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RoboSystemsAuthClient } from '../../auth-core/client'
import { useSSO } from '../../auth-core/sso'
import type { AuthUser } from '../../auth-core/types'
import { SignInForm } from '../SignInForm'

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />, // eslint-disable-line @next/next/no-img-element
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

const mockAuthClient = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
}))

vi.mock('../../auth-core/client', () => ({
  RoboSystemsAuthClient: vi.fn(() => mockAuthClient),
}))

const mockUseSSOInstance = vi.hoisted(() => ({
  checkSSOAuthentication: vi.fn(),
  handleSSOLogin: vi.fn(),
  generateSSOToken: vi.fn(),
  getSSORedirectUrl: vi.fn(),
}))

vi.mock('../../auth-core/sso', () => ({
  useSSO: vi.fn(() => mockUseSSOInstance),
}))

vi.mock('../../ui-components', () => ({
  Spinner: ({ size, fullScreen }: any) => (
    <div data-testid="spinner">
      Loading {size} {fullScreen && '(fullscreen)'}
    </div>
  ),
}))

const mockUseRouter = vi.mocked(useRouter)
const mockRoboSystemsAuthClient = vi.mocked(RoboSystemsAuthClient)
const mockUseSSOHook = vi.mocked(useSSO)

describe('SignInForm', () => {
  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  const defaultProps = {
    apiUrl: 'https://api.example.com',
    enableSSO: true,
    onSuccess: vi.fn(),
    onRedirect: vi.fn(),
    redirectTo: '/dashboard',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseRouter.mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    } as any)

    mockAuthClient.login.mockReset()
    mockAuthClient.register.mockReset()

    mockUseSSOInstance.checkSSOAuthentication.mockResolvedValue(null)
    mockUseSSOInstance.handleSSOLogin.mockResolvedValue(null)
    mockUseSSOInstance.generateSSOToken.mockReset()
    mockUseSSOInstance.getSSORedirectUrl.mockReset()

    mockRoboSystemsAuthClient.mockImplementation(() => mockAuthClient as any)
    mockUseSSOHook.mockReturnValue(mockUseSSOInstance as any)
  })

  describe('Initial Render', () => {
    it('should render sign-in form with all required fields', async () => {
      render(<SignInForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      })

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument()
      expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument()
    })

    it('should show SSO checking state initially when SSO is enabled', () => {
      render(<SignInForm {...defaultProps} />)

      const spinner = screen.getByTestId('spinner')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveTextContent(/loading/i)
      expect(spinner).toHaveTextContent(/xl/i)
    })

    it('should not check SSO when disabled', async () => {
      render(<SignInForm {...defaultProps} enableSSO={false} />)

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      })

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })
  })

  describe('SSO Authentication', () => {
    it('should handle successful SSO authentication', async () => {
      mockUseSSOInstance.checkSSOAuthentication.mockResolvedValue(mockUser)
      const mockOnSuccess = vi.fn()

      render(<SignInForm {...defaultProps} onSuccess={mockOnSuccess} />)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockUser)
      })

      expect(mockUseSSOInstance.checkSSOAuthentication).toHaveBeenCalled()
    })

    it('should handle SSO authentication failure', async () => {
      mockUseSSOInstance.checkSSOAuthentication.mockResolvedValue(null)

      render(<SignInForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      })

      expect(mockUseSSOInstance.checkSSOAuthentication).toHaveBeenCalled()
    })

    it('should handle SSO login from URL parameters', async () => {
      mockUseSSOInstance.handleSSOLogin.mockResolvedValue(mockUser)
      const mockOnSuccess = vi.fn()

      render(<SignInForm {...defaultProps} onSuccess={mockOnSuccess} />)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockUser)
      })

      expect(mockUseSSOInstance.handleSSOLogin).toHaveBeenCalled()
    })
  })

  describe('Form Submission', () => {
    it('should handle successful login', async () => {
      const mockOnSuccess = vi.fn()
      mockAuthClient.login.mockResolvedValue({
        user: mockUser,
        success: true,
        message: 'Login successful',
      })

      render(<SignInForm {...defaultProps} onSuccess={mockOnSuccess} />)

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      })

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockUser)
      })

      expect(mockAuthClient.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      )
    })

    it('should handle login error', async () => {
      mockAuthClient.login.mockRejectedValue(
        new Error('Invalid email or password')
      )

      render(<SignInForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' },
      })

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/invalid email or password/i)
        ).toBeInTheDocument()
      })

      expect(mockAuthClient.login).toHaveBeenCalledWith(
        'test@example.com',
        'wrongpassword'
      )
    })

    it('should show loading state during submission', async () => {
      mockAuthClient.login.mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      )

      render(<SignInForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      })

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /signing in/i })
        ).toBeDisabled()
      })
    })

    it('should validate required fields', async () => {
      render(<SignInForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      expect(mockAuthClient.login).not.toHaveBeenCalled()
    })
  })

  describe('Form Validation', () => {
    it('should require email field', async () => {
      render(<SignInForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      })

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      expect(mockAuthClient.login).not.toHaveBeenCalled()
    })

    it('should require password field', async () => {
      render(<SignInForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      })

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      expect(mockAuthClient.login).not.toHaveBeenCalled()
    })
  })

  describe('Redirect Handling', () => {
    it('should use onRedirect when sign-up link is clicked', async () => {
      const mockOnRedirect = vi.fn()

      render(<SignInForm {...defaultProps} onRedirect={mockOnRedirect} />)

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      })

      fireEvent.click(
        screen.getByRole('button', { name: /don't have an account\? sign up/i })
      )

      expect(mockOnRedirect).toHaveBeenCalledWith('/register')
    })

    it('should fallback to window.location when sign-up link clicked without onRedirect', async () => {
      const originalLocation = window.location
      const locationMock = {
        ...window.location,
        href: 'about:blank',
      }
      Object.defineProperty(window, 'location', {
        value: locationMock,
        writable: true,
      })

      try {
        render(
          <SignInForm apiUrl="https://api.example.com" enableSSO={false} />
        )

        await waitFor(() => {
          expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
        })

        fireEvent.click(
          screen.getByRole('button', {
            name: /don't have an account\? sign up/i,
          })
        )

        expect(window.location.href).toBe('/register')
      } finally {
        Object.defineProperty(window, 'location', {
          value: originalLocation,
          writable: true,
        })
      }
    })
  })

  describe('Props and Configuration', () => {
    it('should apply custom className', async () => {
      render(<SignInForm {...defaultProps} className="custom-class" />)

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      })

      const form = screen
        .getByRole('button', { name: /sign in/i })
        .closest('form')
      expect(form).toHaveClass('custom-class')
    })

    it('should handle missing optional props', async () => {
      render(<SignInForm apiUrl="https://api.example.com" enableSSO={false} />)

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      })

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error messages', async () => {
      mockAuthClient.login.mockRejectedValue(new Error('Network error'))

      render(<SignInForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      })

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/invalid email or password/i)
        ).toBeInTheDocument()
      })
    })

    it('should clear error on successful retry', async () => {
      mockAuthClient.login
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          user: mockUser,
          success: true,
          message: 'Login successful',
        })

      const mockOnSuccess = vi.fn()

      render(<SignInForm {...defaultProps} onSuccess={mockOnSuccess} />)

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      })
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/invalid email or password/i)
        ).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockUser)
        expect(
          screen.queryByText(/invalid email or password/i)
        ).not.toBeInTheDocument()
      })
    })
  })
})
