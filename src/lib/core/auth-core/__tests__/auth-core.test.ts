import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RoboSystemsAuthClient } from '../client'
import type { APIKey, AuthUser, CreateAPIKeyRequest } from '../types'

// Mock the SDK - using centralized mock from src/__mocks__/@robosystems/client.js
vi.mock('@robosystems/client')

import {
  client,
  completeSsoAuth,
  createUserApiKey,
  generateSsoToken,
  getCurrentAuthUser,
  listUserApiKeys,
  loginUser,
  logoutUser,
  refreshAuthSession,
  registerUser,
  revokeUserApiKey,
  ssoTokenExchange,
} from '@robosystems/client'

const mockedLoginUser = vi.mocked(loginUser)
const mockedRegisterUser = vi.mocked(registerUser)
const mockedLogoutUser = vi.mocked(logoutUser)
const mockedGetCurrentAuthUser = vi.mocked(getCurrentAuthUser)
const mockedRefreshAuthSession = vi.mocked(refreshAuthSession)
const mockedCreateUserApiKey = vi.mocked(createUserApiKey)
const mockedListUserApiKeys = vi.mocked(listUserApiKeys)
const mockedRevokeUserApiKey = vi.mocked(revokeUserApiKey)
const mockedGenerateSsoToken = vi.mocked(generateSsoToken)
const mockedSsoTokenExchange = vi.mocked(ssoTokenExchange)
const mockedCompleteSsoAuth = vi.mocked(completeSsoAuth)

describe('Auth Core - Basic Tests', () => {
  let authClient: RoboSystemsAuthClient
  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    authClient = new RoboSystemsAuthClient('https://api.example.com')
  })

  describe('RoboSystemsAuthClient Constructor', () => {
    it('should initialize with base URL and configure client', () => {
      expect(client.setConfig).toHaveBeenCalledWith({
        baseUrl: 'https://api.example.com',
        credentials: 'include',
        headers: {},
      })
    })

    it('should remove trailing slash from base URL', () => {
      new RoboSystemsAuthClient('https://api.example.com/')
      expect(client.setConfig).toHaveBeenCalledWith({
        baseUrl: 'https://api.example.com',
        credentials: 'include',
        headers: {},
      })
    })
  })

  describe.skip('Authentication Methods', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        data: {
          user: mockUser,
          message: 'Login successful',
        },
        request: {} as Request,
        response: {} as Response,
      }
      mockedLoginUser.mockResolvedValue(mockResponse as any)

      const result = await authClient.login('test@example.com', 'password')

      expect(loginUser).toHaveBeenCalledWith({
        client,
        body: { email: 'test@example.com', password: 'password' },
      })
      expect(result).toEqual({
        user: mockUser,
        success: true,
        message: 'Login successful',
      })
    })

    it('should register successfully', async () => {
      const mockResponse = {
        data: {
          user: mockUser,
          message: 'Registration successful',
        },
        request: {} as Request,
        response: {} as Response,
      }
      mockedRegisterUser.mockResolvedValue(mockResponse as any)

      const result = await authClient.register(
        'test@example.com',
        'password',
        'Test User'
      )

      expect(registerUser).toHaveBeenCalledWith({
        client,
        body: {
          email: 'test@example.com',
          password: 'password',
          name: 'Test User',
        },
      })
      expect(result).toEqual({
        user: mockUser,
        success: true,
        message: 'Registration successful',
      })
    })

    it('should register with empty name when not provided', async () => {
      const mockResponse = {
        data: {
          user: mockUser,
          message: 'Registration successful',
        },
        request: {} as Request,
        response: {} as Response,
      }
      mockedRegisterUser.mockResolvedValue(mockResponse as any)

      await authClient.register('test@example.com', 'password')

      expect(registerUser).toHaveBeenCalledWith({
        client,
        body: { email: 'test@example.com', password: 'password', name: '' },
      })
    })

    it('should logout successfully', async () => {
      mockedLogoutUser.mockResolvedValue({
        data: {},
        request: {} as Request,
        response: {} as Response,
      })

      await authClient.logout()

      expect(logoutUser).toHaveBeenCalledWith({ client })
    })
  })

  describe.skip('User Info Methods', () => {
    it('should get current user successfully', async () => {
      const mockResponse = {
        data: { user: mockUser },
        request: {} as Request,
        response: {} as Response,
      }
      mockedGetCurrentAuthUser.mockResolvedValue(mockResponse)

      const result = await authClient.getCurrentUser()

      expect(getCurrentAuthUser).toHaveBeenCalledWith({ client })
      expect(result).toEqual(mockUser)
    })

    it('should cache getCurrentUser results for 5 seconds', async () => {
      const mockResponse = {
        data: { user: mockUser },
        request: {} as Request,
        response: {} as Response,
      }
      mockedGetCurrentAuthUser.mockResolvedValue(mockResponse)

      // First call
      const result1 = await authClient.getCurrentUser()
      // Second call immediately
      const result2 = await authClient.getCurrentUser()

      expect(getCurrentAuthUser).toHaveBeenCalledTimes(1)
      expect(result1).toEqual(mockUser)
      expect(result2).toEqual(mockUser)
    })

    it('should cache errors for 5 seconds', async () => {
      const error = new Error('Unauthorized')
      mockedGetCurrentAuthUser.mockRejectedValue(error)

      // First call should throw
      await expect(authClient.getCurrentUser()).rejects.toThrow('Unauthorized')

      // Second call should return cached error without making another request
      await expect(authClient.getCurrentUser()).rejects.toThrow('Unauthorized')

      expect(getCurrentAuthUser).toHaveBeenCalledTimes(1)
    })

    it('should deduplicate concurrent requests', async () => {
      const mockResponse = {
        data: { user: mockUser },
        request: {} as Request,
        response: {} as Response,
      }
      mockedGetCurrentAuthUser.mockResolvedValue(mockResponse)

      // Make concurrent requests
      const [result1, result2, result3] = await Promise.all([
        authClient.getCurrentUser(),
        authClient.getCurrentUser(),
        authClient.getCurrentUser(),
      ])

      expect(getCurrentAuthUser).toHaveBeenCalledTimes(1)
      expect(result1).toEqual(mockUser)
      expect(result2).toEqual(mockUser)
      expect(result3).toEqual(mockUser)
    })

    it('should check authentication and return user', async () => {
      const mockResponse = {
        data: { user: mockUser },
        request: {} as Request,
        response: {} as Response,
      }
      mockedGetCurrentAuthUser.mockResolvedValue(mockResponse)

      const result = await authClient.checkAuthentication()

      expect(result).toEqual(mockUser)
    })

    it('should check authentication and return null on error', async () => {
      mockedGetCurrentAuthUser.mockRejectedValue(new Error('Unauthorized'))

      const result = await authClient.checkAuthentication()

      expect(result).toBeNull()
    })

    it('should refresh session successfully', async () => {
      const mockResponse = {
        data: {
          user: mockUser,
          message: 'Session refreshed',
        },
        request: {} as Request,
        response: {} as Response,
      }
      mockedRefreshAuthSession.mockResolvedValue(mockResponse as any)

      const result = await authClient.refreshSession()

      expect(refreshAuthSession).toHaveBeenCalledWith({ client })
      expect(result).toEqual({
        user: mockUser,
        success: true,
        message: 'Session refreshed',
      })
    })
  })

  describe.skip('Cache Management', () => {
    it('should clear auth cache', async () => {
      const mockResponse = {
        data: { user: mockUser },
        request: {} as Request,
        response: {} as Response,
      }
      mockedGetCurrentAuthUser.mockResolvedValue(mockResponse)

      // Cache a result
      await authClient.getCurrentUser()
      expect(getCurrentAuthUser).toHaveBeenCalledTimes(1)

      // Clear cache
      authClient.clearAuthCache()

      // Next call should make new request
      await authClient.getCurrentUser()
      expect(getCurrentAuthUser).toHaveBeenCalledTimes(2)
    })

    it('should clear error cache on successful request after cache expires', async () => {
      // First request fails
      mockedGetCurrentAuthUser.mockRejectedValueOnce(new Error('Unauthorized'))

      await expect(authClient.getCurrentUser()).rejects.toThrow('Unauthorized')

      // Clear cache to simulate time passing
      authClient.clearAuthCache()

      // Second request succeeds
      const mockResponse = {
        data: { user: mockUser },
        request: {} as Request,
        response: {} as Response,
      }
      mockedGetCurrentAuthUser.mockResolvedValue(mockResponse)

      const result = await authClient.getCurrentUser()

      expect(result).toEqual(mockUser)
      expect(getCurrentAuthUser).toHaveBeenCalledTimes(2)
    })
  })

  describe.skip('API Key Management', () => {
    it('should create API key successfully', async () => {
      const request: CreateAPIKeyRequest = {
        name: 'Test Key',
        permissions: ['read', 'write'],
        graphId: 'graph-123',
        expiresAt: '2024-12-31T23:59:59Z',
      }

      const mockResponse = {
        data: {
          api_key: {
            id: 'key-123',
            name: 'Test Key',
            created_at: '2024-01-01T00:00:00Z',
            is_active: true,
            last_used_at: null,
            prefix: 'rlap_test',
          },
          key: 'rlap_test_key_123',
        },
        request: {} as Request,
        response: {} as Response,
      }
      mockedCreateUserApiKey.mockResolvedValue(mockResponse as any)

      const result = await authClient.createAPIKey(request)

      expect(createUserApiKey).toHaveBeenCalledWith({
        client,
        body: {
          name: 'Test Key',
          description: 'read, write',
        },
      })

      const expected: APIKey = {
        id: 'key-123',
        name: 'Test Key',
        key: 'rlap_test_key_123',
        permissions: ['read', 'write'],
        graphId: 'graph-123',
        createdAt: '2024-01-01T00:00:00Z',
        isActive: true,
        lastUsedAt: null,
        expiresAt: '2024-12-31T23:59:59Z',
      }
      expect(result).toEqual(expected)
    })

    it('should list API keys successfully', async () => {
      const mockResponse = {
        data: {
          api_keys: [
            {
              id: 'key-123',
              name: 'Test Key',
              prefix: 'rlap_abc',
              created_at: '2024-01-01T00:00:00Z',
              is_active: true,
              last_used_at: '2024-01-02T00:00:00Z',
            },
          ],
        },
        request: {} as Request,
        response: {} as Response,
      }
      mockedListUserApiKeys.mockResolvedValue(mockResponse)

      const result = await authClient.getAPIKeys()

      expect(listUserApiKeys).toHaveBeenCalledWith({ client })
      expect(result).toEqual([
        {
          id: 'key-123',
          name: 'Test Key',
          key: 'rlap_abc...',
          permissions: [],
          createdAt: '2024-01-01T00:00:00Z',
          isActive: true,
          lastUsedAt: '2024-01-02T00:00:00Z',
        },
      ])
    })

    it('should revoke API key successfully', async () => {
      mockedRevokeUserApiKey.mockResolvedValue({
        data: { success: true, message: 'API key revoked successfully' },
        request: {} as Request,
        response: {} as Response,
      } as any)

      await authClient.revokeAPIKey('key-123')

      expect(revokeUserApiKey).toHaveBeenCalledWith({
        client,
        path: { api_key_id: 'key-123' },
      })
    })
  })
})
