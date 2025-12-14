import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GraphTier } from '../graph-tiers'
import {
  fetchGraphTiers,
  formatTierForDisplay,
  getPopularTier,
  getTierColor,
  supportsSubgraphs,
} from '../graph-tiers'

// Mock SDK
vi.mock('@robosystems/client', () => ({
  getAvailableGraphTiers: vi.fn(),
}))

// Mock core index (client import)
vi.mock('../../index', () => ({
  client: {},
}))

import { getAvailableGraphTiers } from '@robosystems/client'

const mockGetAvailableGraphTiers = vi.mocked(getAvailableGraphTiers)

describe('graph-tiers', () => {
  const mockTiersResponse = {
    tiers: [
      {
        tier: 'free',
        display_name: 'Free',
        monthly_price: 0,
        max_subgraphs: 0,
        limits: {
          max_nodes: 1000,
          max_relationships: 1000,
        },
      },
      {
        tier: 'basic',
        display_name: 'Basic',
        monthly_price: 29,
        max_subgraphs: 1,
        limits: {
          max_nodes: 10000,
          max_relationships: 10000,
        },
      },
      {
        tier: 'premium',
        display_name: 'Premium',
        monthly_price: 99,
        max_subgraphs: 5,
        limits: {
          max_nodes: 100000,
          max_relationships: 100000,
        },
      },
    ] as GraphTier[],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchGraphTiers', () => {
    it('should fetch graph tiers successfully', async () => {
      mockGetAvailableGraphTiers.mockResolvedValue({
        data: mockTiersResponse,
        error: null,
        request: {} as Request,
        response: {} as Response,
      })

      const result = await fetchGraphTiers()

      expect(result).toEqual(mockTiersResponse)
      expect(mockGetAvailableGraphTiers).toHaveBeenCalledWith({
        client: {},
        query: {
          include_disabled: false,
        },
      })
    })

    it('should include disabled tiers when requested', async () => {
      mockGetAvailableGraphTiers.mockResolvedValue({
        data: mockTiersResponse,
        error: null,
        request: {} as Request,
        response: {} as Response,
      })

      await fetchGraphTiers(true)

      expect(mockGetAvailableGraphTiers).toHaveBeenCalledWith({
        client: {},
        query: {
          include_disabled: true,
        },
      })
    })

    it('should throw error when API call fails', async () => {
      const errorResponse = {
        data: null,
        error: { message: 'API Error' },
        request: {} as Request,
        response: {} as Response,
      }

      mockGetAvailableGraphTiers.mockResolvedValue(errorResponse)

      await expect(fetchGraphTiers()).rejects.toThrow(
        'Failed to fetch graph tiers: API Error'
      )
    })

    it('should throw error for unknown error format', async () => {
      const errorResponse = {
        data: null,
        error: 'Unknown error',
        request: {} as Request,
        response: {} as Response,
      }

      mockGetAvailableGraphTiers.mockResolvedValue(errorResponse)

      await expect(fetchGraphTiers()).rejects.toThrow(
        'Failed to fetch graph tiers: Unknown error'
      )
    })

    it('should throw error when error has no message', async () => {
      const errorResponse = {
        data: null,
        error: {},
        request: {} as Request,
        response: {} as Response,
      }

      mockGetAvailableGraphTiers.mockResolvedValue(errorResponse)

      await expect(fetchGraphTiers()).rejects.toThrow(
        'Failed to fetch graph tiers: Unknown error'
      )
    })
  })

  describe('getTierColor', () => {
    const tiers = mockTiersResponse.tiers

    it('should return "info" for lowest priced tier', () => {
      const freeTier = tiers.find((t) => t.tier === 'free')!

      const result = getTierColor(freeTier, tiers)

      expect(result).toBe('info')
    })

    it('should return "success" for highest priced tier', () => {
      const premiumTier = tiers.find((t) => t.tier === 'premium')!

      const result = getTierColor(premiumTier, tiers)

      expect(result).toBe('success')
    })

    it('should return "warning" for middle tier', () => {
      const basicTier = tiers.find((t) => t.tier === 'basic')!

      const result = getTierColor(basicTier, tiers)

      expect(result).toBe('warning')
    })

    it('should handle null prices as 0', () => {
      const tiersWithNull = [
        { ...tiers[0], monthly_price: null },
        { ...tiers[1], monthly_price: 29 },
      ]

      const nullTier = tiersWithNull[0]
      const result = getTierColor(nullTier, tiersWithNull)

      expect(result).toBe('info')
    })

    it('should handle undefined prices as 0', () => {
      const tiersWithUndefined = [
        { ...tiers[0], monthly_price: undefined },
        { ...tiers[1], monthly_price: 29 },
      ]

      const undefinedTier = tiersWithUndefined[0]
      const result = getTierColor(undefinedTier, tiersWithUndefined)

      expect(result).toBe('info')
    })

    it('should handle single tier', () => {
      const singleTier = [tiers[0]]

      const result = getTierColor(tiers[0], singleTier)

      expect(result).toBe('info')
    })

    it('should handle two tiers', () => {
      const twoTiers = [tiers[0], tiers[1]] // free and basic

      expect(getTierColor(twoTiers[0], twoTiers)).toBe('info') // free (lowest)
      expect(getTierColor(twoTiers[1], twoTiers)).toBe('success') // basic (highest)
    })
  })

  describe('getPopularTier', () => {
    it('should return null for empty tiers array', () => {
      const result = getPopularTier([])

      expect(result).toBeNull()
    })

    it('should return the single tier when only one exists', () => {
      const singleTier = [mockTiersResponse.tiers[0]]

      const result = getPopularTier(singleTier)

      expect(result).toBe('free')
    })

    it('should return the middle tier by price for odd number of tiers', () => {
      // free ($0), basic ($29), premium ($99) - middle is basic
      const result = getPopularTier(mockTiersResponse.tiers)

      expect(result).toBe('basic')
    })

    it('should return the higher middle tier by price for even number of tiers', () => {
      const fourTiers = [
        { ...mockTiersResponse.tiers[0], monthly_price: 0 }, // $0
        { ...mockTiersResponse.tiers[1], monthly_price: 19 }, // $19
        { ...mockTiersResponse.tiers[2], monthly_price: 49 }, // $49
        {
          ...mockTiersResponse.tiers[2],
          monthly_price: 99,
          tier: 'enterprise',
        }, // $99
      ]

      // Sorted: $0, $19, $49, $99 - middle two are $49 and $99, should return $49 tier
      const result = getPopularTier(fourTiers)

      expect(result).toBe('premium') // The $49 tier
    })

    it('should handle null prices', () => {
      const tiersWithNulls = [
        {
          ...mockTiersResponse.tiers[0],
          monthly_price: null,
          tier: 'null-tier',
        },
        { ...mockTiersResponse.tiers[1], monthly_price: 29 },
      ]

      const result = getPopularTier(tiersWithNulls)

      expect(result).toBe('basic') // Should prefer the priced tier
    })

    it('should handle undefined prices', () => {
      const tiersWithUndefined = [
        {
          ...mockTiersResponse.tiers[0],
          monthly_price: undefined,
          tier: 'undefined-tier',
        },
        { ...mockTiersResponse.tiers[1], monthly_price: 29 },
      ]

      const result = getPopularTier(tiersWithUndefined)

      expect(result).toBe('basic')
    })
  })

  describe('supportsSubgraphs', () => {
    it('should return true when max_subgraphs is greater than 0', () => {
      const tierWithSubgraphs: GraphTier = {
        ...mockTiersResponse.tiers[1],
        max_subgraphs: 5,
      }

      const result = supportsSubgraphs(tierWithSubgraphs)

      expect(result).toBe(true)
    })

    it('should return false when max_subgraphs is 0', () => {
      const tierWithoutSubgraphs: GraphTier = {
        ...mockTiersResponse.tiers[0],
        max_subgraphs: 0,
      }

      const result = supportsSubgraphs(tierWithoutSubgraphs)

      expect(result).toBe(false)
    })

    it('should return false when max_subgraphs is null', () => {
      const tierWithNullSubgraphs: GraphTier = {
        ...mockTiersResponse.tiers[0],
        max_subgraphs: null,
      }

      const result = supportsSubgraphs(tierWithNullSubgraphs)

      expect(result).toBe(false)
    })
  })

  describe('formatTierForDisplay', () => {
    it('should format tier with price', () => {
      const tier: GraphTier = {
        ...mockTiersResponse.tiers[1], // basic tier
        monthly_price: 29,
      }

      const result = formatTierForDisplay(tier)

      expect(result).toBe('Basic $29/mo')
    })

    it('should format tier without price', () => {
      const tier: GraphTier = {
        ...mockTiersResponse.tiers[0], // free tier
        monthly_price: 0,
      }

      const result = formatTierForDisplay(tier)

      expect(result).toBe('Free')
    })

    it('should handle null price', () => {
      const tier: GraphTier = {
        ...mockTiersResponse.tiers[0],
        monthly_price: null,
      }

      const result = formatTierForDisplay(tier)

      expect(result).toBe('Free')
    })

    it('should handle undefined price', () => {
      const tier: GraphTier = {
        ...mockTiersResponse.tiers[0],
        monthly_price: undefined,
      }

      const result = formatTierForDisplay(tier)

      expect(result).toBe('Free')
    })

    it('should trim whitespace when no price', () => {
      const tier: GraphTier = {
        ...mockTiersResponse.tiers[0],
        display_name: 'Free',
        monthly_price: undefined,
      }

      const result = formatTierForDisplay(tier)

      expect(result).toBe('Free')
    })
  })
})
