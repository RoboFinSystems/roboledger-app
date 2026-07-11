import { client } from '@robosystems/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getSafeReturnUrl, SSOManager } from '../sso'

// Mock the config module
vi.mock('../config', () => ({
  APP_CONFIGS: {
    app1: { url: 'https://app1.example.com', name: 'App 1' },
    app2: { url: 'https://app2.example.com', name: 'App 2' },
  },
  getAppConfig: vi.fn(),
}))

type MockAuthClient = {
  checkAuthentication: ReturnType<typeof vi.fn>
  generateSSOToken: ReturnType<typeof vi.fn>
  ssoExchange: ReturnType<typeof vi.fn>
  ssoComplete: ReturnType<typeof vi.fn>
}

const createMockAuthClient = (): MockAuthClient => ({
  checkAuthentication: vi.fn(),
  generateSSOToken: vi.fn(),
  ssoExchange: vi.fn(),
  ssoComplete: vi.fn(),
})

const runWithDevelopmentEnv = async (callback: () => Promise<void> | void) => {
  const originalEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'development'
  try {
    await callback()
  } finally {
    process.env.NODE_ENV = originalEnv
  }
}

const syncLocationHref = () => {
  window.location.href = `${window.location.origin}${window.location.pathname}${window.location.search || ''}${window.location.hash || ''}`
}

// APP_CONFIGS is mocked (app1/app2.example.com), so the allowlist is
// { currentOrigin, https://app1.example.com, https://app2.example.com }.
describe('getSafeReturnUrl (M5 open-redirect guard)', () => {
  const origin = 'https://app1.example.com'

  it('allows same-origin relative paths', () => {
    expect(getSafeReturnUrl('/dashboard', origin)).toBe('/dashboard')
    expect(getSafeReturnUrl('/a/b?c=1#d', origin)).toBe('/a/b?c=1#d')
  })

  it('allows absolute URLs on the current origin', () => {
    expect(getSafeReturnUrl('https://app1.example.com/x', origin)).toBe(
      'https://app1.example.com/x'
    )
  })

  it('allows absolute URLs on other known apps (APP_CONFIGS)', () => {
    expect(getSafeReturnUrl('https://app2.example.com/x', origin)).toBe(
      'https://app2.example.com/x'
    )
  })

  it('rejects off-allowlist origins (open redirect)', () => {
    expect(getSafeReturnUrl('https://evil.com/phish', origin)).toBeNull()
    // Suffix/lookalike host must not match app1.example.com.
    expect(
      getSafeReturnUrl('https://app1.example.com.evil.com/x', origin)
    ).toBeNull()
  })

  it('rejects protocol-relative and backslash tricks', () => {
    expect(getSafeReturnUrl('//evil.com', origin)).toBeNull()
    expect(getSafeReturnUrl('/\\evil.com', origin)).toBeNull()
    expect(getSafeReturnUrl('/path\\..\\x', origin)).toBeNull()
  })

  it('rejects embedded tab/CR/LF that browsers strip before navigating', () => {
    // "/\t/evil.com" -> browser strips the tab -> "//evil.com" (open redirect)
    expect(getSafeReturnUrl('/\t/evil.com', origin)).toBeNull()
    expect(getSafeReturnUrl('/\r/evil.com', origin)).toBeNull()
    expect(getSafeReturnUrl('/\n/evil.com', origin)).toBeNull()
    expect(getSafeReturnUrl('/\t//evil.com', origin)).toBeNull()
  })

  it('rejects dangerous schemes (javascript:/data:)', () => {
    expect(getSafeReturnUrl('javascript:alert(1)', origin)).toBeNull()
    expect(
      getSafeReturnUrl('data:text/html,<script>alert(1)</script>', origin)
    ).toBeNull()
  })

  it('rejects empty / whitespace / nullish input', () => {
    expect(getSafeReturnUrl('', origin)).toBeNull()
    expect(getSafeReturnUrl('   ', origin)).toBeNull()
    expect(getSafeReturnUrl(null, origin)).toBeNull()
    expect(getSafeReturnUrl(undefined, origin)).toBeNull()
  })
})

describe('SSOManager', () => {
  let ssoManager: SSOManager
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(client as any).checkAuthentication = vi.fn()
    ssoManager = new SSOManager('https://api.example.com')
  })

  describe('Constructor', () => {
    it('should initialize with RoboSystemsAuthClient', () => {
      expect(client.setConfig).toHaveBeenCalledWith({
        baseUrl: 'https://api.example.com',
        credentials: 'include',
        headers: {},
      })
    })
  })

  describe('checkSSOAuthentication', () => {
    it('should return user when authentication succeeds', async () => {
      const mockAuthClient = createMockAuthClient()
      mockAuthClient.checkAuthentication.mockResolvedValue(mockUser)
      ;(ssoManager as any).authClient = mockAuthClient

      const result = await ssoManager.checkSSOAuthentication()

      expect(result).toEqual(mockUser)
      expect(mockAuthClient.checkAuthentication).toHaveBeenCalled()
    })

    it('should return null when authentication fails', async () => {
      const mockAuthClient = createMockAuthClient()
      mockAuthClient.checkAuthentication.mockRejectedValue(
        new Error('Unauthorized')
      )
      ;(ssoManager as any).authClient = mockAuthClient

      const result = await ssoManager.checkSSOAuthentication()

      expect(result).toBeNull()
      expect(mockAuthClient.checkAuthentication).toHaveBeenCalled()
    })
  })

  describe('generateSSOToken', () => {
    it('should generate SSO token successfully', async () => {
      const mockAuthClient = createMockAuthClient()
      ;(ssoManager as any).authClient = mockAuthClient

      const mockResponse = {
        token: 'sso-token-123',
        expires_at: '2024-01-01T01:00:00Z',
        apps: ['app1', 'app2'],
      }
      mockAuthClient.generateSSOToken.mockResolvedValue(mockResponse as any)

      const result = await ssoManager.generateSSOToken()

      expect(mockAuthClient.generateSSOToken).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getSSORedirectUrl', () => {
    let originalLocation: Location
    let mockSessionStorage: Storage
    let originalHistory: History
    let mockHistory: Pick<History, 'replaceState'>

    beforeEach(() => {
      // Mock window.location
      originalLocation = window.location
      delete (window as any).location
      window.location = {
        href: 'https://example.com',
        origin: 'https://example.com',
        pathname: '/',
        search: '',
        hash: '',
      } as Location

      // Mock sessionStorage
      mockSessionStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      } as Storage
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSessionStorage,
        writable: true,
      })

      // Mock history to avoid cross-origin errors
      originalHistory = window.history
      mockHistory = {
        replaceState: vi.fn((_, __, url?: string) => {
          if (url) {
            window.location.href = url
            const parsedUrl = new URL(url)
            window.location.search = parsedUrl.search
            window.location.pathname = parsedUrl.pathname
          }
        }),
      }
      Object.defineProperty(window, 'history', {
        value: mockHistory,
        writable: true,
      })
    })

    afterEach(() => {
      window.location = originalLocation
      Object.defineProperty(window, 'history', {
        value: originalHistory,
      })
    })

    it('should generate SSO redirect URL successfully', async () => {
      const mockAuthClient = createMockAuthClient()
      mockAuthClient.generateSSOToken.mockResolvedValue({
        token: 'sso-token-123',
        expires_at: '2024-01-01T01:00:00Z',
        apps: ['app1', 'app2'],
      })
      mockAuthClient.ssoExchange.mockResolvedValue({
        session_id: 'session-123',
      })
      ;(ssoManager as any).authClient = mockAuthClient

      const result = await ssoManager.getSSORedirectUrl(
        'app1',
        'https://example.com/dashboard'
      )

      expect(mockAuthClient.generateSSOToken).toHaveBeenCalled()
      expect(mockAuthClient.ssoExchange).toHaveBeenCalledWith(
        'sso-token-123',
        'app1'
      )
      expect(result).toBe(
        'https://app1.example.com/login?session_id=session-123&returnUrl=https%3A%2F%2Fexample.com%2Fdashboard'
      )
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'sso_target_app',
        'app1'
      )
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'sso_return_url',
        'https://example.com/dashboard'
      )
    })

    it('should handle sessionStorage errors gracefully', async () => {
      await runWithDevelopmentEnv(async () => {
        const mockAuthClient = createMockAuthClient()
        mockAuthClient.generateSSOToken.mockResolvedValue({
          token: 'sso-token-123',
          expires_at: '2024-01-01T01:00:00Z',
          apps: ['app1'],
        })
        mockAuthClient.ssoExchange.mockResolvedValue({
          session_id: 'session-123',
        })
        ;(ssoManager as any).authClient = mockAuthClient
        mockSessionStorage.setItem = vi.fn().mockImplementation(() => {
          throw new Error('Storage error')
        })

        // Mock console.debug to avoid noise
        const consoleSpy = vi
          .spyOn(console, 'debug')
          .mockImplementation(() => {})

        const result = await ssoManager.getSSORedirectUrl('app1')

        expect(result).toBe(
          'https://app1.example.com/login?session_id=session-123'
        )
        expect(consoleSpy).toHaveBeenCalledWith(
          '[SSO] sessionStorage write failed during SSO URL generation',
          expect.any(Error)
        )

        consoleSpy.mockRestore()
      })
    })

    it('should throw error for unknown app', async () => {
      const mockAuthClient = createMockAuthClient()
      mockAuthClient.generateSSOToken.mockResolvedValue({
        token: 'sso-token-123',
        expires_at: '2024-01-01T01:00:00Z',
        apps: ['app1', 'app2'],
      })
      ;(ssoManager as any).authClient = mockAuthClient

      await expect(ssoManager.getSSORedirectUrl('unknown-app')).rejects.toThrow(
        'Unknown app: unknown-app'
      )
    })

    it('should generate URL without return URL', async () => {
      const mockAuthClient = createMockAuthClient()
      mockAuthClient.generateSSOToken.mockResolvedValue({
        token: 'sso-token-123',
        expires_at: '2024-01-01T01:00:00Z',
        apps: ['app1'],
      })
      mockAuthClient.ssoExchange.mockResolvedValue({
        session_id: 'session-123',
      })
      ;(ssoManager as any).authClient = mockAuthClient

      const result = await ssoManager.getSSORedirectUrl('app1')

      expect(result).toBe(
        'https://app1.example.com/login?session_id=session-123'
      )
      expect(mockSessionStorage.setItem).not.toHaveBeenCalledWith(
        'sso_return_url',
        expect.anything()
      )
    })
  })

  describe('handleSSOLogin', () => {
    let originalLocation: Location
    let mockSessionStorage: Storage
    let originalHistory: History
    let mockHistory: Pick<History, 'replaceState'>

    beforeEach(() => {
      // Mock window.location
      originalLocation = window.location
      delete (window as any).location
      window.location = {
        href: 'https://app1.example.com/login?session_id=session-123&returnUrl=https%3A%2F%2Fapp2.example.com%2Fdashboard',
        origin: 'https://app1.example.com',
        pathname: '/login',
        search:
          '?session_id=session-123&returnUrl=https%3A%2F%2Fapp2.example.com%2Fdashboard',
        hash: '',
      } as any

      originalHistory = window.history
      mockHistory = {
        replaceState: vi.fn(),
      }
      Object.defineProperty(window, 'history', {
        value: mockHistory,
        writable: true,
      })

      // Mock sessionStorage
      mockSessionStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      } as Storage
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSessionStorage,
        writable: true,
      })

      // Mock setTimeout
      vi.useFakeTimers()
    })

    afterEach(() => {
      window.location = originalLocation
      Object.defineProperty(window, 'history', {
        value: originalHistory,
      })
      vi.useRealTimers()
    })

    it('should complete SSO login successfully', async () => {
      const mockAuthClient = createMockAuthClient()
      mockAuthClient.ssoComplete.mockResolvedValue({
        user: mockUser,
      } as any)
      ;(ssoManager as any).authClient = mockAuthClient

      const result = await ssoManager.handleSSOLogin()

      expect(mockAuthClient.ssoComplete).toHaveBeenCalledWith('session-123')
      expect(result).toEqual(mockUser)
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        {},
        '',
        'https://app1.example.com/login'
      )
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'sso_target_app'
      )
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'sso_return_url'
      )

      // Should navigate after delay (allowlisted app origin)
      vi.advanceTimersByTime(100)
      expect(window.location.href).toBe('https://app2.example.com/dashboard')
    })

    it('should handle sessionStorage fallback for return URL', async () => {
      // Mock URL without returnUrl param
      window.location.search = '?session_id=session-123'
      syncLocationHref()

      const mockAuthClient = createMockAuthClient()
      mockAuthClient.ssoComplete.mockResolvedValue({
        user: mockUser,
      } as any)
      ;(ssoManager as any).authClient = mockAuthClient
      mockSessionStorage.getItem = vi
        .fn()
        .mockReturnValue('https://app2.example.com/fallback')

      const result = await ssoManager.handleSSOLogin()

      expect(result).toEqual(mockUser)
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('sso_return_url')
      vi.advanceTimersByTime(100)
      expect(window.location.href).toBe('https://app2.example.com/fallback')
    })

    it('should handle sessionStorage read errors gracefully', async () => {
      await runWithDevelopmentEnv(async () => {
        mockSessionStorage.getItem = vi.fn().mockImplementation(() => {
          throw new Error('Storage error')
        })

        const mockAuthClient = createMockAuthClient()
        mockAuthClient.ssoComplete.mockResolvedValue({
          user: mockUser,
        } as any)
        ;(ssoManager as any).authClient = mockAuthClient

        // Mock console.debug
        const consoleSpy = vi
          .spyOn(console, 'debug')
          .mockImplementation(() => {})

        const result = await ssoManager.handleSSOLogin()

        expect(result).toEqual(mockUser)
        expect(consoleSpy).toHaveBeenCalledWith(
          '[SSO] sessionStorage read failed during SSO login',
          expect.any(Error)
        )

        consoleSpy.mockRestore()
      })
    })

    it('should return null when no session ID in URL', async () => {
      window.location.search = ''
      syncLocationHref()

      const mockAuthClient = createMockAuthClient()
      ;(ssoManager as any).authClient = mockAuthClient

      const result = await ssoManager.handleSSOLogin()

      expect(result).toBeNull()
      expect(mockAuthClient.ssoComplete).not.toHaveBeenCalled()
    })

    it('should handle SSO completion errors', async () => {
      const mockAuthClient = createMockAuthClient()
      mockAuthClient.ssoComplete.mockRejectedValue(new Error('SSO failed'))
      ;(ssoManager as any).authClient = mockAuthClient

      // Mock console.debug
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})

      const result = await ssoManager.handleSSOLogin()

      expect(result).toBeNull()
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        {},
        '',
        'https://app1.example.com/login'
      )
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'sso_target_app'
      )
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'sso_return_url'
      )

      consoleSpy.mockRestore()
    })

    it('should handle sessionStorage cleanup errors gracefully', async () => {
      await runWithDevelopmentEnv(async () => {
        const mockAuthClient = createMockAuthClient()
        mockAuthClient.ssoComplete.mockResolvedValue({
          user: mockUser,
        } as any)
        ;(ssoManager as any).authClient = mockAuthClient
        mockSessionStorage.removeItem = vi.fn().mockImplementation(() => {
          throw new Error('Storage error')
        })

        // Mock console.debug
        const consoleSpy = vi
          .spyOn(console, 'debug')
          .mockImplementation(() => {})

        const result = await ssoManager.handleSSOLogin()

        expect(result).toEqual(mockUser)
        expect(consoleSpy).toHaveBeenCalledWith(
          '[SSO] sessionStorage cleanup failed during SSO success',
          expect.any(Error)
        )

        consoleSpy.mockRestore()
      })
    })

    it('should not navigate when return URL matches current path', async () => {
      window.location.search = '?session_id=session-123&returnUrl=%2Flogin'
      syncLocationHref()

      const mockAuthClient = createMockAuthClient()
      mockAuthClient.ssoComplete.mockResolvedValue({
        user: mockUser,
      } as any)
      ;(ssoManager as any).authClient = mockAuthClient

      const result = await ssoManager.handleSSOLogin()

      expect(result).toEqual(mockUser)
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        {},
        '',
        'https://app1.example.com/login'
      )
      vi.advanceTimersByTime(100)
    })

    it('blocks navigation to an off-allowlist returnUrl (open redirect)', async () => {
      window.location.search =
        '?session_id=session-123&returnUrl=https%3A%2F%2Fevil.com%2Fphish'
      syncLocationHref()

      const mockAuthClient = createMockAuthClient()
      mockAuthClient.ssoComplete.mockResolvedValue({
        user: mockUser,
      } as any)
      ;(ssoManager as any).authClient = mockAuthClient

      const result = await ssoManager.handleSSOLogin()

      expect(result).toEqual(mockUser)
      // The decoded evil.com destination must never be navigated to; the page
      // stays on the app1 login URL (evil.com only survives url-encoded as a
      // query param, not as the navigation target).
      vi.advanceTimersByTime(100)
      expect(window.location.href).not.toBe('https://evil.com/phish')
      expect(window.location.href).toContain('app1.example.com/login')
    })
  })
})
