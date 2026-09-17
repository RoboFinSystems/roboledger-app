import { fireEvent, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mockUseOptionalAuth = vi.fn()

vi.mock('@robosystems/core/auth-components', () => ({
  useOptionalAuth: () => mockUseOptionalAuth(),
}))
vi.mock('@robosystems/core/ui-components/Logo', () => ({
  LogoBadge: () => <span />,
}))

import Header from '../Header'

const signedOut = { isAuthenticated: false, isLoading: false }
const signedIn = { isAuthenticated: true, isLoading: false }

function openMobileMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Toggle mobile menu' }))
}

function hrefsOf(name: string) {
  return screen
    .queryAllByRole('link', { name })
    .map((link) => link.getAttribute('href'))
}

describe('Header', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('offers Login and Get Started to a signed-out visitor, desktop and mobile', () => {
    mockUseOptionalAuth.mockReturnValue(signedOut)
    render(<Header />)
    openMobileMenu()

    expect(hrefsOf('Login')).toEqual(['/login', '/login'])
    expect(hrefsOf('Get Started')).toEqual(['/register', '/register'])
    expect(hrefsOf('Open app')).toEqual([])
  })

  it('offers Open app instead of Login and Get Started to a signed-in visitor', () => {
    mockUseOptionalAuth.mockReturnValue(signedIn)
    render(<Header />)
    openMobileMenu()

    expect(hrefsOf('Open app')).toEqual(['/home', '/home'])
    expect(hrefsOf('Login')).toEqual([])
    expect(hrefsOf('Get Started')).toEqual([])
  })

  it('keeps Login and Get Started while the session is still being checked', () => {
    mockUseOptionalAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    })
    render(<Header />)

    expect(hrefsOf('Login')).toEqual(['/login'])
    expect(hrefsOf('Open app')).toEqual([])
  })

  it('renders Login and Get Started with no auth provider around it', () => {
    mockUseOptionalAuth.mockReturnValue(null)
    render(<Header />)

    expect(hrefsOf('Get Started')).toEqual(['/register'])
    expect(hrefsOf('Open app')).toEqual([])
  })

  it('sends Login and Get Started in the server HTML even for a signed-in session', () => {
    mockUseOptionalAuth.mockReturnValue(signedIn)
    const html = renderToString(<Header />)

    expect(html).toContain('href="/login"')
    expect(html).toContain('href="/register"')
    expect(html).not.toContain('Open app')
  })
})
