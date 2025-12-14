/* global globalThis */
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import type { SidebarCookie } from '../sidebar-cookie'
import { clientSidebarCookie, sidebarCookie } from '../sidebar-cookie'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

const mockDocument = {
  cookie: '',
}

const mockWindow = {
  location: {
    protocol: 'http:',
  },
}

const originalDocument = (globalThis as any).document
const originalWindow = (globalThis as any).window

import { cookies } from 'next/headers'

const mockCookies = vi.mocked(cookies)

describe('sidebarCookie (Server-side)', () => {
  const mockCookieStore = {
    get: vi.fn(),
    set: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCookies.mockResolvedValue(mockCookieStore as any)
  })

  describe('get', () => {
    it('should return default collapsed state when no cookie exists', async () => {
      mockCookieStore.get.mockReturnValue(null)

      const result = await sidebarCookie.get()

      expect(result).toEqual({ isCollapsed: false })
    })

    it('should return collapsed state as true when cookie value is "true"', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'true' })

      const result = await sidebarCookie.get()

      expect(result).toEqual({ isCollapsed: true })
    })

    it('should return collapsed state as false when cookie value is "false"', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'false' })

      const result = await sidebarCookie.get()

      expect(result).toEqual({ isCollapsed: false })
    })

    it('should return collapsed state as false for any non-"true" value', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'maybe' })

      const result = await sidebarCookie.get()

      expect(result).toEqual({ isCollapsed: false })
    })
  })

  describe('set', () => {
    it('should set cookie with correct options in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const value: SidebarCookie = { isCollapsed: true }

      await sidebarCookie.set(value)

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'sidebar-collapsed',
        'true',
        {
          path: '/',
          maxAge: 60 * 60 * 24 * 365, // 1 year
          sameSite: 'lax',
          secure: true,
        }
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should set cookie with correct options in development', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const value: SidebarCookie = { isCollapsed: false }

      await sidebarCookie.set(value)

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'sidebar-collapsed',
        'false',
        {
          path: '/',
          maxAge: 60 * 60 * 24 * 365, // 1 year
          sameSite: 'lax',
          secure: false,
        }
      )

      process.env.NODE_ENV = originalEnv
    })
  })
})

describe('clientSidebarCookie (Client-side)', () => {
  beforeAll(() => {
    ;(globalThis as any).document = mockDocument as any
    ;(globalThis as any).window = mockWindow as any
  })

  afterAll(() => {
    ;(globalThis as any).document = originalDocument
    ;(globalThis as any).window = originalWindow
  })

  beforeEach(() => {
    mockDocument.cookie = ''
    mockWindow.location.protocol = 'http:'
  })

  describe('get', () => {
    it('should return default collapsed state on server side', () => {
      const originalDocument = global.document
      delete (global as any).document

      const result = clientSidebarCookie.get()

      expect(result).toEqual({ isCollapsed: false })

      global.document = originalDocument
    })

    it('should return default collapsed state when cookie not found', () => {
      mockDocument.cookie = 'other-cookie=value'

      const result = clientSidebarCookie.get()

      expect(result).toEqual({ isCollapsed: false })
    })

    it('should return collapsed state as true when cookie value is "true"', () => {
      mockDocument.cookie = 'sidebar-collapsed=true'

      const result = clientSidebarCookie.get()

      expect(result).toEqual({ isCollapsed: true })
    })

    it('should return collapsed state as false when cookie value is "false"', () => {
      mockDocument.cookie = 'sidebar-collapsed=false'

      const result = clientSidebarCookie.get()

      expect(result).toEqual({ isCollapsed: false })
    })

    it('should return collapsed state as false for any non-"true" value', () => {
      mockDocument.cookie = 'sidebar-collapsed=maybe'

      const result = clientSidebarCookie.get()

      expect(result).toEqual({ isCollapsed: false })
    })

    it('should handle multiple cookies correctly', () => {
      mockDocument.cookie = 'other=value; sidebar-collapsed=true; another=test'

      const result = clientSidebarCookie.get()

      expect(result).toEqual({ isCollapsed: true })
    })
  })

  describe('set', () => {
    it('should do nothing on server side', () => {
      const originalDocument = global.document
      delete (global as any).document

      clientSidebarCookie.set({ isCollapsed: true })

      // Should not throw or modify anything
      global.document = originalDocument
    })

    it('should set cookie with HTTP protocol', () => {
      mockWindow.location.protocol = 'http:'
      const value: SidebarCookie = { isCollapsed: true }

      clientSidebarCookie.set(value)

      expect(mockDocument.cookie).toBe(
        'sidebar-collapsed=true; path=/; max-age=31536000; samesite=lax'
      )
    })

    it('should set cookie with HTTPS protocol', () => {
      mockWindow.location.protocol = 'https:'
      const value: SidebarCookie = { isCollapsed: false }

      clientSidebarCookie.set(value)

      expect(mockDocument.cookie).toBe(
        'sidebar-collapsed=false; path=/; max-age=31536000; samesite=lax; secure'
      )
    })

    it('should set correct max-age for 1 year', () => {
      const value: SidebarCookie = { isCollapsed: true }

      clientSidebarCookie.set(value)

      const cookieValue = mockDocument.cookie
      expect(cookieValue).toContain('max-age=31536000') // 365 * 24 * 60 * 60
    })
  })
})
