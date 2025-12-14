import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RoboSystemsAuthClient } from '../../auth-core/client'
import type { AuthUser } from '../../auth-core/types'
import { SignUpForm } from '../SignUpForm'

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

vi.mock('../../auth-core/sso', () => ({
  useSSO: vi.fn(),
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

describe('SignUpForm', () => {
  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  const defaultProps = {
    apiUrl: 'https://api.example.com',
    onSuccess: vi.fn(),
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

    mockRoboSystemsAuthClient.mockImplementation(() => mockAuthClient as any)
  })

  describe('Initial Render', () => {
    it('should render sign-up form with all required fields', () => {
      render(<SignUpForm {...defaultProps} />)

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText('Confirm password')
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /create account/i })
      ).toBeInTheDocument()
      expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument()
    })

    it('should render form immediately without loading state', () => {
      render(<SignUpForm {...defaultProps} />)

      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should handle successful registration', async () => {
      const mockOnSuccess = vi.fn()
      mockAuthClient.register.mockResolvedValue({
        user: mockUser,
        success: true,
        message: 'Registration successful',
      })

      render(<SignUpForm {...defaultProps} onSuccess={mockOnSuccess} />)

      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Test User' },
      })
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      })
      fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
        target: { value: 'password123' },
      })
      fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
        target: { value: 'password123' },
      })

      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockUser)
      })

      expect(mockAuthClient.register).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'Test User',
        undefined
      )
    })

    it('should handle registration error', async () => {
      mockAuthClient.register.mockRejectedValue(
        new Error('Email already exists')
      )

      render(<SignUpForm {...defaultProps} />)

      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Test User' },
      })
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'existing@example.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      })
      fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
        target: { value: 'password123' },
      })

      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument()
      })

      expect(mockAuthClient.register).toHaveBeenCalledWith(
        'existing@example.com',
        'password123',
        'Test User',
        undefined
      )
    })

    it('should show loading state during submission', async () => {
      mockAuthClient.register.mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      )

      render(<SignUpForm {...defaultProps} />)

      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Test User' },
      })
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      })
      fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
        target: { value: 'password123' },
      })
      fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
        target: { value: 'password123' },
      })

      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /creating account/i })
        ).toBeDisabled()
      })
    })

    it('should validate required fields', () => {
      render(<SignUpForm {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      expect(mockAuthClient.register).not.toHaveBeenCalled()
    })

    it('should validate password confirmation', async () => {
      render(<SignUpForm {...defaultProps} />)

      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Test User' },
      })
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      })
      fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
        target: { value: 'differentpassword' },
      })

      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      })

      expect(mockAuthClient.register).not.toHaveBeenCalled()
    })
  })

  describe('Props and Configuration', () => {
    it('should apply custom className', () => {
      render(<SignUpForm {...defaultProps} className="custom-class" />)

      const form = screen
        .getByRole('button', { name: /create account/i })
        .closest('form')
      expect(form).toHaveClass('custom-class')
    })

    it('should handle missing optional props', () => {
      render(<SignUpForm apiUrl="https://api.example.com" enableSSO={false} />)

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error messages', async () => {
      mockAuthClient.register.mockRejectedValue(new Error('Network error'))

      render(<SignUpForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Test User' },
      })
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      })
      fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
        target: { value: 'password123' },
      })

      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(mockAuthClient.register).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    it('should clear error on successful retry', async () => {
      mockAuthClient.register
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          user: mockUser,
          success: true,
          message: 'Registration successful',
        })

      const mockOnSuccess = vi.fn()

      render(<SignUpForm {...defaultProps} onSuccess={mockOnSuccess} />)

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Test User' },
      })
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      })
      fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
        target: { value: 'password123' },
      })
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText(/first error/i)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockUser)
        expect(screen.queryByText(/first error/i)).not.toBeInTheDocument()
      })
    })
  })
})
