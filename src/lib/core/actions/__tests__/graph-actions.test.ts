import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearGraphSelection,
  getGraphSelection,
  persistGraphSelection,
} from '../graph-actions'

vi.mock('../../lib/graph-cookie', () => ({
  graphCookie: {
    set: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
}))

import { graphCookie } from '../../lib/graph-cookie'

const mockGraphCookie = vi.mocked(graphCookie)

describe('Graph Actions (Server)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('persistGraphSelection', () => {
    it('should persist graph selection to cookie', async () => {
      const graphId = 'test-graph-123'

      await persistGraphSelection(graphId)

      expect(mockGraphCookie.set).toHaveBeenCalledWith({ graphId })
      expect(mockGraphCookie.set).toHaveBeenCalledTimes(1)
    })

    it('should handle empty graph ID', async () => {
      const graphId = ''

      await persistGraphSelection(graphId)

      expect(mockGraphCookie.set).toHaveBeenCalledWith({ graphId: '' })
    })

    it('should handle special characters in graph ID', async () => {
      const graphId = 'graph-with-special-chars_123-456'

      await persistGraphSelection(graphId)

      expect(mockGraphCookie.set).toHaveBeenCalledWith({ graphId })
    })
  })

  describe('clearGraphSelection', () => {
    it('should clear graph selection cookie', async () => {
      await clearGraphSelection()

      expect(mockGraphCookie.delete).toHaveBeenCalledTimes(1)
    })
  })

  describe('getGraphSelection', () => {
    it('should return graph ID when cookie exists', async () => {
      const graphId = 'test-graph-123'
      mockGraphCookie.get.mockResolvedValue({ graphId })

      const result = await getGraphSelection()

      expect(result).toBe(graphId)
      expect(mockGraphCookie.get).toHaveBeenCalledTimes(1)
    })

    it('should return null when no cookie exists', async () => {
      mockGraphCookie.get.mockResolvedValue(null)

      const result = await getGraphSelection()

      expect(result).toBeNull()
      expect(mockGraphCookie.get).toHaveBeenCalledTimes(1)
    })

    it('should return null when cookie has null graphId', async () => {
      mockGraphCookie.get.mockResolvedValue({ graphId: null as any })

      const result = await getGraphSelection()

      expect(result).toBeNull()
    })

    it('should return null when cookie has undefined graphId', async () => {
      const graphId = undefined as any
      mockGraphCookie.get.mockResolvedValue({ graphId })

      const result = await getGraphSelection()

      expect(result).toBeNull()
    })

    it('should handle empty string graph ID', async () => {
      const graphId = ''
      mockGraphCookie.get.mockResolvedValue({ graphId })

      const result = await getGraphSelection()

      expect(result).toBe('')
    })
  })

  describe('Error Handling', () => {
    it('should propagate errors from cookie operations', async () => {
      const error = new Error('Cookie operation failed')
      mockGraphCookie.set.mockRejectedValue(error)

      await expect(persistGraphSelection('test-graph')).rejects.toThrow(
        'Cookie operation failed'
      )
    })

    it('should propagate errors from get operations', async () => {
      const error = new Error('Cookie read failed')
      mockGraphCookie.get.mockRejectedValue(error)

      await expect(getGraphSelection()).rejects.toThrow('Cookie read failed')
    })

    it('should propagate errors from delete operations', async () => {
      const error = new Error('Cookie delete failed')
      mockGraphCookie.delete.mockRejectedValue(error)

      await expect(clearGraphSelection()).rejects.toThrow(
        'Cookie delete failed'
      )
    })
  })

  describe('Integration Flow', () => {
    it('should support persist -> get -> clear cycle', async () => {
      const graphId = 'test-graph-123'

      // Persist
      await persistGraphSelection(graphId)
      expect(mockGraphCookie.set).toHaveBeenCalledWith({ graphId })

      // Get
      mockGraphCookie.get.mockResolvedValue({ graphId })
      const retrievedId = await getGraphSelection()
      expect(retrievedId).toBe(graphId)

      // Clear
      await clearGraphSelection()
      expect(mockGraphCookie.delete).toHaveBeenCalled()

      // Verify cleared
      mockGraphCookie.get.mockResolvedValue(null)
      const clearedId = await getGraphSelection()
      expect(clearedId).toBeNull()
    })

    it('should handle multiple graph selections', async () => {
      const graphId1 = 'graph-1'
      const graphId2 = 'graph-2'

      // First selection
      await persistGraphSelection(graphId1)
      expect(mockGraphCookie.set).toHaveBeenCalledWith({ graphId: graphId1 })

      // Second selection (should overwrite)
      await persistGraphSelection(graphId2)
      expect(mockGraphCookie.set).toHaveBeenCalledWith({ graphId: graphId2 })
      expect(mockGraphCookie.set).toHaveBeenCalledTimes(2)
    })
  })
})
