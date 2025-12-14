import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCreditVisibility,
  setCreditVisibility,
} from '../credit-visibility-actions'

vi.mock('../../lib/credit-visibility-cookie', () => ({
  creditVisibilityCookie: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

import { creditVisibilityCookie } from '../../lib/credit-visibility-cookie'

const mockCreditVisibilityCookie = vi.mocked(creditVisibilityCookie)

describe('Credit Visibility Actions (Server)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('getCreditVisibility', () => {
    it('should return true when credits should be shown', async () => {
      mockCreditVisibilityCookie.get.mockResolvedValue({ showCredits: true })

      const result = await getCreditVisibility()

      expect(result).toBe(true)
      expect(mockCreditVisibilityCookie.get).toHaveBeenCalledTimes(1)
    })

    it('should return false when credits should be hidden', async () => {
      mockCreditVisibilityCookie.get.mockResolvedValue({ showCredits: false })

      const result = await getCreditVisibility()

      expect(result).toBe(false)
      expect(mockCreditVisibilityCookie.get).toHaveBeenCalledTimes(1)
    })

    it('should handle default showCredits value', async () => {
      mockCreditVisibilityCookie.get.mockResolvedValue({ showCredits: true })

      const result = await getCreditVisibility()

      expect(result).toBe(true)
    })
  })

  describe('setCreditVisibility', () => {
    it('should set credit visibility to true', async () => {
      const showCredits = true

      await setCreditVisibility(showCredits)

      expect(mockCreditVisibilityCookie.set).toHaveBeenCalledWith({
        showCredits: true,
      })
      expect(mockCreditVisibilityCookie.set).toHaveBeenCalledTimes(1)
    })

    it('should set credit visibility to false', async () => {
      const showCredits = false

      await setCreditVisibility(showCredits)

      expect(mockCreditVisibilityCookie.set).toHaveBeenCalledWith({
        showCredits: false,
      })
      expect(mockCreditVisibilityCookie.set).toHaveBeenCalledTimes(1)
    })

    it('should handle boolean values correctly', async () => {
      // Test with true
      await setCreditVisibility(true)
      expect(mockCreditVisibilityCookie.set).toHaveBeenCalledWith({
        showCredits: true,
      })

      // Test with false
      await setCreditVisibility(false)
      expect(mockCreditVisibilityCookie.set).toHaveBeenCalledWith({
        showCredits: false,
      })

      expect(mockCreditVisibilityCookie.set).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Handling', () => {
    it('should propagate errors from get operations', async () => {
      const error = new Error('Cookie read failed')
      mockCreditVisibilityCookie.get.mockRejectedValue(error)

      await expect(getCreditVisibility()).rejects.toThrow('Cookie read failed')
    })

    it('should propagate errors from set operations', async () => {
      const error = new Error('Cookie write failed')
      mockCreditVisibilityCookie.set.mockRejectedValue(error)

      await expect(setCreditVisibility(true)).rejects.toThrow(
        'Cookie write failed'
      )
    })
  })

  describe('Integration Flow', () => {
    it('should support set -> get cycle', async () => {
      // Set to false
      await setCreditVisibility(false)
      expect(mockCreditVisibilityCookie.set).toHaveBeenCalledWith({
        showCredits: false,
      })

      // Get should return false
      mockCreditVisibilityCookie.get.mockResolvedValue({ showCredits: false })
      const result1 = await getCreditVisibility()
      expect(result1).toBe(false)

      // Set to true
      await setCreditVisibility(true)
      expect(mockCreditVisibilityCookie.set).toHaveBeenCalledWith({
        showCredits: true,
      })

      // Get should return true
      mockCreditVisibilityCookie.get.mockResolvedValue({ showCredits: true })
      const result2 = await getCreditVisibility()
      expect(result2).toBe(true)
    })

    it('should handle multiple preference changes', async () => {
      // Multiple changes
      await setCreditVisibility(true)
      await setCreditVisibility(false)
      await setCreditVisibility(true)

      expect(mockCreditVisibilityCookie.set).toHaveBeenCalledTimes(3)
      expect(mockCreditVisibilityCookie.set).toHaveBeenNthCalledWith(1, {
        showCredits: true,
      })
      expect(mockCreditVisibilityCookie.set).toHaveBeenNthCalledWith(2, {
        showCredits: false,
      })
      expect(mockCreditVisibilityCookie.set).toHaveBeenNthCalledWith(3, {
        showCredits: true,
      })
    })
  })

  describe('Type Safety', () => {
    it('should handle boolean parameters correctly', async () => {
      // Test with boolean literals
      await setCreditVisibility(true)
      await setCreditVisibility(false)

      // Test with boolean expressions
      const condition = 1 > 0
      await setCreditVisibility(condition)
      expect(mockCreditVisibilityCookie.set).toHaveBeenLastCalledWith({
        showCredits: true,
      })

      const falseCondition = 1 < 0
      await setCreditVisibility(falseCondition)
      expect(mockCreditVisibilityCookie.set).toHaveBeenLastCalledWith({
        showCredits: false,
      })
    })

    it('should return boolean values', async () => {
      mockCreditVisibilityCookie.get.mockResolvedValue({ showCredits: true })
      const result1 = await getCreditVisibility()
      expect(typeof result1).toBe('boolean')
      expect(result1).toBe(true)

      mockCreditVisibilityCookie.get.mockResolvedValue({ showCredits: false })
      const result2 = await getCreditVisibility()
      expect(typeof result2).toBe('boolean')
      expect(result2).toBe(false)
    })
  })
})
