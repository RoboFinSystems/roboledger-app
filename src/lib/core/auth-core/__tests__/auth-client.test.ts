import {
  client,
  getCurrentAuthUser,
  loginUser,
  logoutUser,
} from '@robosystems/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RoboSystemsAuthClient } from '../client'

const mockedClient = vi.mocked(client)
const mockedGetCurrentAuthUser = vi.mocked(getCurrentAuthUser)
const mockedLoginUser = vi.mocked(loginUser)
const mockedLogoutUser = vi.mocked(logoutUser)

describe('Auth System Core Tests', () => {
  describe('RoboSystemsAuthClient', () => {
    let authClient: RoboSystemsAuthClient

    beforeEach(() => {
      authClient = new RoboSystemsAuthClient('https://api.test.com')
      vi.clearAllMocks()
    })

    it('should initialize with correct config', () => {
      // Create a new instance to test initialization
      const testClient = new RoboSystemsAuthClient('https://test.example.com')

      // Check that setConfig was called (it gets called during construction)
      expect(mockedClient.setConfig).toHaveBeenCalledWith({
        baseUrl: 'https://test.example.com',
        credentials: 'include',
        headers: {},
      })
    })

    it('should handle getCurrentUser success', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      }

      mockedGetCurrentAuthUser.mockResolvedValueOnce({
        data: { user: mockUser },
      } as any)

      const result = await authClient.getCurrentUser()

      expect(result).toEqual(mockUser)
      expect(mockedGetCurrentAuthUser).toHaveBeenCalledWith({
        client: expect.any(Object),
      })
    })

    it('should handle getCurrentUser failure', async () => {
      mockedGetCurrentAuthUser.mockRejectedValueOnce(new Error('Unauthorized'))

      await expect(authClient.getCurrentUser()).rejects.toThrow('Unauthorized')
    })

    it('should handle login success', async () => {
      const mockResponse = {
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        success: true,
        message: 'Success',
      }

      mockedLoginUser.mockResolvedValueOnce({ data: mockResponse } as any)

      const result = await authClient.login('test@example.com', 'password')

      expect(result).toEqual(mockResponse)
      expect(mockedLoginUser).toHaveBeenCalledWith({
        client: expect.any(Object),
        body: { email: 'test@example.com', password: 'password' },
      })
    })

    it('should handle logout', async () => {
      mockedLogoutUser.mockResolvedValueOnce({} as any)

      await authClient.logout()

      expect(mockedLogoutUser).toHaveBeenCalledWith({
        client: expect.any(Object),
      })
    })

    it('should cache authentication results', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      }

      // Mock timers for cache testing
      vi.useFakeTimers()

      mockedGetCurrentAuthUser.mockResolvedValueOnce({
        data: { user: mockUser },
      } as any)

      // First call
      const result1 = await authClient.getCurrentUser()
      expect(result1).toEqual(mockUser)
      expect(mockedGetCurrentAuthUser).toHaveBeenCalledTimes(1)

      // Second call within cache window (30 seconds)
      const result2 = await authClient.getCurrentUser()
      expect(result2).toEqual(mockUser)
      expect(mockedGetCurrentAuthUser).toHaveBeenCalledTimes(1) // No additional call

      // Fast-forward past cache expiry (30s + 1s)
      vi.advanceTimersByTime(31000)

      // Third call should make new request
      mockedGetCurrentAuthUser.mockResolvedValueOnce({
        data: { user: mockUser },
      } as any)
      const result3 = await authClient.getCurrentUser()
      expect(result3).toEqual(mockUser)
      expect(mockedGetCurrentAuthUser).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })

    it('should clear cache correctly', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      }

      mockedGetCurrentAuthUser.mockResolvedValueOnce({
        data: { user: mockUser },
      } as any)

      // Populate cache
      await authClient.getCurrentUser()
      expect(mockedGetCurrentAuthUser).toHaveBeenCalledTimes(1)

      // Use cache
      await authClient.getCurrentUser()
      expect(mockedGetCurrentAuthUser).toHaveBeenCalledTimes(1)

      // Clear cache
      authClient.clearAuthCache()

      // Next call should make new request
      mockedGetCurrentAuthUser.mockResolvedValueOnce({
        data: { user: mockUser },
      } as any)
      await authClient.getCurrentUser()
      expect(mockedGetCurrentAuthUser).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Handling', () => {
    let authClient: RoboSystemsAuthClient

    beforeEach(() => {
      authClient = new RoboSystemsAuthClient('https://api.test.com')
      authClient.clearAuthCache() // Clear cache between tests
      vi.clearAllMocks()
    })

    it('should handle network errors', async () => {
      mockedGetCurrentAuthUser.mockRejectedValueOnce(new Error('Network error'))

      await expect(authClient.getCurrentUser()).rejects.toThrow('Network error')
    })

    it('should handle malformed responses', async () => {
      mockedGetCurrentAuthUser.mockResolvedValueOnce({ data: null } as any)

      // Should handle gracefully, though might throw due to null data
      await expect(authClient.getCurrentUser()).rejects.toThrow()
    })

    it('should return null for checkAuthentication on error', async () => {
      mockedGetCurrentAuthUser.mockRejectedValueOnce(new Error('Unauthorized'))

      const result = await authClient.checkAuthentication()
      expect(result).toBeNull()
    })
  })

  describe('Request Deduplication', () => {
    let authClient: RoboSystemsAuthClient

    beforeEach(() => {
      authClient = new RoboSystemsAuthClient('https://api.test.com')
      authClient.clearAuthCache() // Clear cache between tests
      vi.clearAllMocks()
    })

    it('should deduplicate concurrent requests', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      }

      // Return a promise that we can control
      let resolvePromise: (value: any) => void
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockedGetCurrentAuthUser.mockReturnValueOnce(delayedPromise as any)

      // Make multiple concurrent calls
      const promise1 = authClient.getCurrentUser()
      const promise2 = authClient.getCurrentUser()
      const promise3 = authClient.getCurrentUser()

      // Resolve the promise
      resolvePromise!({ data: { user: mockUser } })

      // All should resolve to the same result
      const [result1, result2, result3] = await Promise.all([
        promise1,
        promise2,
        promise3,
      ])

      expect(result1).toEqual(mockUser)
      expect(result2).toEqual(mockUser)
      expect(result3).toEqual(mockUser)

      // Should only make one API call
      expect(mockedGetCurrentAuthUser).toHaveBeenCalledTimes(1)
    })
  })
})
