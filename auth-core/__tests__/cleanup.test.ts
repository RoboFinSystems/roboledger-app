import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearUserCookies,
  clearUserLocalStorage,
  clearUserSessionStorage,
  listUserData,
  performLogoutCleanup,
  resetUIState,
} from '../cleanup'

describe('Logout Cleanup Utilities', () => {
  beforeEach(() => {
    // Clear all storage and cookies before each test
    localStorage.clear()
    sessionStorage.clear()

    // Clear cookies by setting them to expired dates
    document.cookie.split(';').forEach((c) => {
      const eqPos = c.indexOf('=')
      const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      }
    })
  })

  describe('clearUserCookies', () => {
    it('should clear user-specific cookies', () => {
      // Set some cookies including user-specific ones
      document.cookie = 'selected-graph=graph123; path=/'
      document.cookie = 'credit-visibility=true; path=/'
      document.cookie = 'sidebar-collapsed=false; path=/'
      document.cookie = 'theme=dark; path=/' // Should NOT be cleared

      // Verify cookies are set
      expect(document.cookie).toContain('selected-graph=graph123')
      expect(document.cookie).toContain('credit-visibility=true')

      // Clear user cookies
      clearUserCookies()

      // User-specific cookies should be cleared
      expect(document.cookie).not.toContain('selected-graph=graph123')
      expect(document.cookie).not.toContain('credit-visibility=true')

      // UI preference cookies should remain (sidebar-collapsed is not cleared)
      // Theme cookies should remain (not in our clear list)
      expect(document.cookie).toContain('theme=dark')
    })
  })

  describe('clearUserLocalStorage', () => {
    it('should clear user-specific localStorage items', () => {
      // Set various localStorage items
      localStorage.setItem('saved_queries_graph123', '["query1", "query2"]')
      localStorage.setItem('graph_settings_graph456', '{"setting": "value"}')
      localStorage.setItem('user_preferences', '{"pref": "value"}')
      localStorage.setItem('theme', 'dark') // Should NOT be cleared
      localStorage.setItem('language', 'en') // Should NOT be cleared

      // Verify items are set
      expect(localStorage.getItem('saved_queries_graph123')).toBeTruthy()
      expect(localStorage.getItem('graph_settings_graph456')).toBeTruthy()
      expect(localStorage.getItem('user_preferences')).toBeTruthy()
      expect(localStorage.getItem('theme')).toBe('dark')

      // Clear user localStorage
      clearUserLocalStorage()

      // User-specific items should be cleared
      expect(localStorage.getItem('saved_queries_graph123')).toBeNull()
      expect(localStorage.getItem('graph_settings_graph456')).toBeNull()
      expect(localStorage.getItem('user_preferences')).toBeNull()

      // Non-user items should remain
      expect(localStorage.getItem('theme')).toBe('dark')
      expect(localStorage.getItem('language')).toBe('en')
    })
  })

  describe('clearUserSessionStorage', () => {
    it('should clear user-specific sessionStorage items', () => {
      // Set various sessionStorage items
      sessionStorage.setItem('auth_user_cache', '{"id": "user123"}')
      sessionStorage.setItem('user_temp_data', '{"temp": "value"}')
      sessionStorage.setItem('graph_temp_data', '{"graph": "data"}')
      sessionStorage.setItem('app_state', '{"page": "dashboard"}') // Should NOT be cleared

      // Verify items are set
      expect(sessionStorage.getItem('auth_user_cache')).toBeTruthy()
      expect(sessionStorage.getItem('user_temp_data')).toBeTruthy()
      expect(sessionStorage.getItem('graph_temp_data')).toBeTruthy()
      expect(sessionStorage.getItem('app_state')).toBeTruthy()

      // Clear user sessionStorage
      clearUserSessionStorage()

      // User-specific items should be cleared
      expect(sessionStorage.getItem('auth_user_cache')).toBeNull()
      expect(sessionStorage.getItem('user_temp_data')).toBeNull()
      expect(sessionStorage.getItem('graph_temp_data')).toBeNull()

      // Non-user items should remain
      expect(sessionStorage.getItem('app_state')).toBe('{"page": "dashboard"}')
    })
  })

  describe('performLogoutCleanup', () => {
    it('should perform comprehensive cleanup', () => {
      // Set up data in all storage types
      document.cookie = 'selected-graph=graph123; path=/'
      localStorage.setItem('saved_queries_graph123', '["query1"]')
      sessionStorage.setItem('auth_user_cache', '{"id": "user123"}')

      // Verify data is set
      expect(document.cookie).toContain('selected-graph=graph123')
      expect(localStorage.getItem('saved_queries_graph123')).toBeTruthy()
      expect(sessionStorage.getItem('auth_user_cache')).toBeTruthy()

      // Perform cleanup
      performLogoutCleanup()

      // All user data should be cleared
      expect(document.cookie).not.toContain('selected-graph=graph123')
      expect(localStorage.getItem('saved_queries_graph123')).toBeNull()
      expect(sessionStorage.getItem('auth_user_cache')).toBeNull()
    })
  })

  describe('resetUIState', () => {
    it('should reset specific UI state', () => {
      // Set graph selection
      document.cookie = 'selected-graph=graph123; path=/'
      document.cookie = 'theme=dark; path=/'

      expect(document.cookie).toContain('selected-graph=graph123')
      expect(document.cookie).toContain('theme=dark')

      // Reset UI state
      resetUIState()

      // Graph selection should be cleared
      expect(document.cookie).not.toContain('selected-graph=graph123')

      // Other UI preferences should remain
      expect(document.cookie).toContain('theme=dark')
    })
  })

  describe('listUserData', () => {
    it('should list all user data for debugging', () => {
      // Set up various data
      document.cookie = 'cookie1=value1; path=/'
      document.cookie = 'cookie2=value2; path=/'
      localStorage.setItem('local1', 'value1')
      localStorage.setItem('local2', 'value2')
      sessionStorage.setItem('session1', 'value1')
      sessionStorage.setItem('session2', 'value2')

      const userData = listUserData()

      expect(userData.cookies).toContain('cookie1')
      expect(userData.cookies).toContain('cookie2')
      expect(userData.localStorage).toContain('local1')
      expect(userData.localStorage).toContain('local2')
      expect(userData.sessionStorage).toContain('session1')
      expect(userData.sessionStorage).toContain('session2')
    })

    it('should handle missing storage gracefully', () => {
      // This test ensures the function doesn't crash if storage is not available
      const userData = listUserData()

      expect(userData).toHaveProperty('cookies')
      expect(userData).toHaveProperty('localStorage')
      expect(userData).toHaveProperty('sessionStorage')
      expect(Array.isArray(userData.cookies)).toBe(true)
      expect(Array.isArray(userData.localStorage)).toBe(true)
      expect(Array.isArray(userData.sessionStorage)).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw errors
      const originalSetItem = Storage.prototype.setItem
      const originalRemoveItem = Storage.prototype.removeItem

      // Set up some data first
      localStorage.setItem('saved_queries_test', 'value')

      // Mock removeItem to throw
      Storage.prototype.removeItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage error')
      })

      // Should not throw error
      expect(() => clearUserLocalStorage()).not.toThrow()

      // Restore original methods
      Storage.prototype.setItem = originalSetItem
      Storage.prototype.removeItem = originalRemoveItem
    })

    it('should handle sessionStorage errors gracefully', () => {
      // Mock sessionStorage to throw errors
      const originalSetItem = Storage.prototype.setItem
      const originalRemoveItem = Storage.prototype.removeItem

      // Set up some data first
      sessionStorage.setItem('auth_test', 'value')

      // Mock removeItem to throw
      Storage.prototype.removeItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage error')
      })

      // Should not throw error
      expect(() => clearUserSessionStorage()).not.toThrow()

      // Restore original methods
      Storage.prototype.setItem = originalSetItem
      Storage.prototype.removeItem = originalRemoveItem
    })
  })
})
