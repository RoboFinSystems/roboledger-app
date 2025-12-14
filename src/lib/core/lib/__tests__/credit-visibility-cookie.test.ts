import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreditVisibilityCookie } from '../credit-visibility-cookie'
import { creditVisibilityCookie } from '../credit-visibility-cookie'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import { cookies } from 'next/headers'

const mockCookies = vi.mocked(cookies)

describe('creditVisibilityCookie', () => {
  const mockCookieStore = {
    get: vi.fn(),
    set: vi.fn(),
  }

  beforeEach(() => {
    vi.resetAllMocks()
    mockCookies.mockResolvedValue(mockCookieStore as any)
  })

  describe('get', () => {
    it('should return default showCredits=true when no cookie exists', async () => {
      mockCookieStore.get.mockReturnValue(null)

      const result = await creditVisibilityCookie.get()

      expect(result).toEqual({ showCredits: true })
    })

    it('should return parsed cookie value', async () => {
      const cookieData: CreditVisibilityCookie = { showCredits: false }
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(cookieData) })

      const result = await creditVisibilityCookie.get()

      expect(result).toEqual(cookieData)
    })

    it('should return default when JSON parsing fails', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'invalid-json' })

      const result = await creditVisibilityCookie.get()

      expect(result).toEqual({ showCredits: true })
    })

    it('should handle cookies import failure gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockCookies.mockRejectedValue(new Error('Import failed'))

      const result = await creditVisibilityCookie.get()

      expect(result).toEqual({ showCredits: true })
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unable to access cookies:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('set', () => {
    it('should set cookie with correct options in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const value: CreditVisibilityCookie = { showCredits: false }

      await creditVisibilityCookie.set(value)

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'credit-visibility',
        JSON.stringify(value),
        {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365, // 1 year
        }
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should set cookie with correct options in development', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const value: CreditVisibilityCookie = { showCredits: true }

      await creditVisibilityCookie.set(value)

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'credit-visibility',
        JSON.stringify(value),
        {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365, // 1 year
        }
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should handle cookies import failure gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockCookies.mockRejectedValue(new Error('Import failed'))

      const value: CreditVisibilityCookie = { showCredits: false }

      await creditVisibilityCookie.set(value)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Unable to set cookie:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('parse', () => {
    it('should return default when cookieString is undefined', () => {
      const result = creditVisibilityCookie.parse(undefined)

      expect(result).toEqual({ showCredits: true })
    })

    it('should return default when cookieString is empty', () => {
      const result = creditVisibilityCookie.parse('')

      expect(result).toEqual({ showCredits: true })
    })

    it('should return default when credit visibility cookie not found', () => {
      const cookieString = 'other=value; another=test'

      const result = creditVisibilityCookie.parse(cookieString)

      expect(result).toEqual({ showCredits: true })
    })

    it('should parse credit visibility cookie correctly', () => {
      const cookieData: CreditVisibilityCookie = { showCredits: false }
      const encodedValue = encodeURIComponent(JSON.stringify(cookieData))
      const cookieString = `other=value; credit-visibility=${encodedValue}; another=test`

      const result = creditVisibilityCookie.parse(cookieString)

      expect(result).toEqual(cookieData)
    })

    it('should return default when JSON parsing fails', () => {
      const cookieString = 'credit-visibility=invalid-json'

      const result = creditVisibilityCookie.parse(cookieString)

      expect(result).toEqual({ showCredits: true })
    })

    it('should handle various cookie formats', () => {
      const cookieData: CreditVisibilityCookie = { showCredits: true }
      const encodedValue = encodeURIComponent(JSON.stringify(cookieData))

      // Test with spaces around equals
      const cookieString1 = `credit-visibility=${encodedValue}`
      const result1 = creditVisibilityCookie.parse(cookieString1)
      expect(result1).toEqual(cookieData)

      // Test with no spaces
      const cookieString2 = `other=value;credit-visibility=${encodedValue};another=test`
      const result2 = creditVisibilityCookie.parse(cookieString2)
      expect(result2).toEqual(cookieData)
    })
  })
})
