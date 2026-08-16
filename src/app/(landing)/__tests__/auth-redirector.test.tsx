import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const redirectorProps = vi.fn()
vi.mock('@robosystems/core', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    LoginRedirector: (props: Record<string, unknown>) => {
      redirectorProps(props)
      return <div data-testid="login-redirector" />
    },
  }
})

import LoginContent from '../login/content'
import RegisterContent from '../register/content'

// Interactive auth is centralized unconditionally — these pages are pure
// redirectors, with no local-form fallback to fall back to.
describe('centralized login redirectors', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('login renders the redirector in login mode', () => {
    render(<LoginContent />)

    expect(screen.getByTestId('login-redirector')).toBeInTheDocument()
    expect(redirectorProps).toHaveBeenCalledWith(
      expect.not.objectContaining({ mode: 'register' })
    )
    expect(redirectorProps).toHaveBeenCalledWith(
      expect.objectContaining({ apiUrl: 'http://localhost:8000' })
    )
  })

  it('register renders the redirector in register mode', () => {
    render(<RegisterContent />)

    expect(screen.getByTestId('login-redirector')).toBeInTheDocument()
    expect(redirectorProps).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'register',
        apiUrl: 'http://localhost:8000',
      })
    )
  })
})
