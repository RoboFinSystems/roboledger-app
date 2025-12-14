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
import type { GraphCookie } from '../graph-cookie'
import { clientGraphCookie, graphCookie } from '../graph-cookie'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

const mockDocument = {
  cookie: '',
}
const originalDocument = (globalThis as any).document

import { cookies } from 'next/headers'

const mockCookies = vi.mocked(cookies)

describe('graphCookie (Server-side)', () => {
  const mockCookieStore = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCookies.mockResolvedValue(mockCookieStore as any)
  })

  describe('get', () => {
    it('should return null when no cookie exists', async () => {
      mockCookieStore.get.mockReturnValue(null)

      const result = await graphCookie.get()

      expect(result).toBeNull()
      expect(mockCookieStore.get).toHaveBeenCalledWith('selected-graph')
    })

    it('should return null when cookie has no value', async () => {
      mockCookieStore.get.mockReturnValue({ value: null })

      const result = await graphCookie.get()

      expect(result).toBeNull()
    })

    it('should return parsed cookie value', async () => {
      const cookieData: GraphCookie = { graphId: 'test-graph-123' }
      const encodedValue = encodeURIComponent(JSON.stringify(cookieData))

      mockCookieStore.get.mockReturnValue({ value: encodedValue })

      const result = await graphCookie.get()

      expect(result).toEqual(cookieData)
    })

    it('should return null when JSON parsing fails', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'invalid-json' })

      const result = await graphCookie.get()

      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('should set cookie with correct options', async () => {
      const cookieData: GraphCookie = { graphId: 'test-graph-123' }
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      await graphCookie.set(cookieData)

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'selected-graph',
        encodeURIComponent(JSON.stringify(cookieData)),
        {
          maxAge: 30 * 24 * 60 * 60, // 30 days
          secure: true,
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        }
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should set cookie without secure flag in development', async () => {
      const cookieData: GraphCookie = { graphId: 'test-graph-123' }
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      await graphCookie.set(cookieData)

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'selected-graph',
        encodeURIComponent(JSON.stringify(cookieData)),
        {
          maxAge: 30 * 24 * 60 * 60, // 30 days
          secure: false,
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        }
      )

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('delete', () => {
    it('should delete the cookie', async () => {
      await graphCookie.delete()

      expect(mockCookieStore.delete).toHaveBeenCalledWith('selected-graph')
    })
  })
})

describe('clientGraphCookie (Client-side)', () => {
  beforeAll(() => {
    ;(globalThis as any).document = mockDocument as any
  })

  afterAll(() => {
    ;(globalThis as any).document = originalDocument
  })

  beforeEach(() => {
    mockDocument.cookie = ''
  })

  describe('get', () => {
    it('should return null on server side', () => {
      const originalDocument = global.document
      delete (global as any).document

      const result = clientGraphCookie.get()

      expect(result).toBeNull()

      global.document = originalDocument
    })

    it('should return null when cookie not found', () => {
      mockDocument.cookie = 'other-cookie=value'

      const result = clientGraphCookie.get()

      expect(result).toBeNull()
    })

    it('should return null when cookie has no value', () => {
      mockDocument.cookie = 'selected-graph='

      const result = clientGraphCookie.get()

      expect(result).toBeNull()
    })

    it('should return parsed cookie value', () => {
      const cookieData: GraphCookie = { graphId: 'test-graph-123' }
      const encodedValue = encodeURIComponent(JSON.stringify(cookieData))
      mockDocument.cookie = `selected-graph=${encodedValue}; other=value`

      const result = clientGraphCookie.get()

      expect(result).toEqual(cookieData)
    })

    it('should return null when JSON parsing fails', () => {
      mockDocument.cookie = 'selected-graph=invalid-json'

      const result = clientGraphCookie.get()

      expect(result).toBeNull()
    })

    it('should handle multiple cookies correctly', () => {
      const cookieData: GraphCookie = { graphId: 'test-graph-123' }
      const encodedValue = encodeURIComponent(JSON.stringify(cookieData))
      mockDocument.cookie = `other=value; selected-graph=${encodedValue}; another=test`

      const result = clientGraphCookie.get()

      expect(result).toEqual(cookieData)
    })
  })
})
