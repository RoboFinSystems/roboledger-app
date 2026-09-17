import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseAuth = vi.fn()
const mockReplace = vi.fn()

vi.mock('@robosystems/core/auth-components', () => ({
  useAuth: () => mockUseAuth(),
}))
vi.mock('@robosystems/core/ui-components', () => ({
  BrandSpinner: () => <span role="status" aria-label="Loading" />,
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))
vi.mock('../content', () => ({
  default: () => <h1>Connect your books.</h1>,
}))
vi.mock('../maintenance', () => ({
  default: () => <div>Maintenance</div>,
}))

import LandingGate from '../LandingGate'

// The server pass has no session, so it renders with isLoading true. Crawlers that do not
// run JavaScript read exactly that pass: the landing content must be in it.
describe('LandingGate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('renders the landing content while auth is still loading, under the cover', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true })
    render(<LandingGate />)

    expect(
      screen.getByRole('heading', { name: 'Connect your books.' })
    ).toBeInTheDocument()
    expect(screen.getByTestId('landing-gate-cover')).toBeInTheDocument()
  })

  it('uncovers the content for a signed-out visitor', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false })
    render(<LandingGate />)

    expect(
      screen.getByRole('heading', { name: 'Connect your books.' })
    ).toBeInTheDocument()
    expect(screen.queryByTestId('landing-gate-cover')).not.toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('keeps a signed-in user covered and sends them home', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false })
    render(<LandingGate />)

    expect(screen.getByTestId('landing-gate-cover')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(mockReplace).toHaveBeenCalledWith('/home')
  })
})
