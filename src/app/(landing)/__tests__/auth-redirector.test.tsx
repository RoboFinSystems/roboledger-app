import { render, screen, waitFor } from '@testing-library/react'
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

describe('centralized-login flag', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('login renders the redirector when the flag is on', () => {
    vi.stubEnv('NEXT_PUBLIC_CENTRALIZED_LOGIN', 'true')

    render(<LoginContent />)

    expect(screen.getByTestId('login-redirector')).toBeInTheDocument()
    expect(redirectorProps).toHaveBeenCalledWith(
      expect.not.objectContaining({ mode: 'register' })
    )
  })

  it('login renders the full form when the flag is off', async () => {
    render(<LoginContent />)

    expect(screen.queryByTestId('login-redirector')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    })
  })

  it('register renders the redirector in register mode when the flag is on', () => {
    vi.stubEnv('NEXT_PUBLIC_CENTRALIZED_LOGIN', 'true')

    render(<RegisterContent />)

    expect(screen.getByTestId('login-redirector')).toBeInTheDocument()
    expect(redirectorProps).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'register' })
    )
  })

  it('register renders the full form when the flag is off', async () => {
    render(<RegisterContent />)

    expect(screen.queryByTestId('login-redirector')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Create your account')).toBeInTheDocument()
    })
  })
})
