import {
  getAvailableGraphTiers,
  type AvailableGraphTiersResponse,
  type GraphTierInfo,
  type GraphTierInstance,
  type GraphTierLimits,
} from '@robosystems/client'
// Import the pre-configured client from core (already set up with auth interceptors)
import { client } from '../index'

/**
 * Graph tier service for fetching tier configurations using the RoboSystems SDK
 */

// Re-export SDK types for backwards compatibility
export type { GraphTierInstance, GraphTierLimits }
export type GraphTier = GraphTierInfo
export type GraphTiersResponse = AvailableGraphTiersResponse

/**
 * Fetch available graph tiers from the API using the RoboSystems client
 * Note: Uses the pre-configured client from core which includes auth interceptors
 */
export async function fetchGraphTiers(
  includeDisabled: boolean = false
): Promise<GraphTiersResponse> {
  const response = await getAvailableGraphTiers({
    client,
    query: {
      include_disabled: includeDisabled,
    },
  })

  if (response.error) {
    const errorMsg =
      response.error &&
      typeof response.error === 'object' &&
      'message' in response.error
        ? String(response.error.message)
        : 'Unknown error'
    throw new Error(`Failed to fetch graph tiers: ${errorMsg}`)
  }

  return response.data as GraphTiersResponse
}

/**
 * Map tier to color for UI display based on price
 * Uses a heuristic: lowest price = info, middle = warning, highest = success
 */
export function getTierColor(
  tier: GraphTier,
  allTiers: GraphTier[]
): 'info' | 'warning' | 'success' {
  // Sort tiers by price (null/undefined treated as 0)
  const sortedByPrice = [...allTiers].sort((a, b) => {
    const priceA = a.monthly_price ?? 0
    const priceB = b.monthly_price ?? 0
    return priceA - priceB
  })

  const tierIndex = sortedByPrice.findIndex((t) => t.tier === tier.tier)
  const totalTiers = sortedByPrice.length

  // Assign colors based on position in sorted list
  if (tierIndex === 0) return 'info' // Lowest price
  if (tierIndex === totalTiers - 1) return 'success' // Highest price
  return 'warning' // Middle tier(s)
}

/**
 * Get the popular/recommended tier (usually the middle tier)
 * Returns the tier with median price or the middle index
 */
export function getPopularTier(tiers: GraphTier[]): string | null {
  if (tiers.length === 0) return null
  if (tiers.length === 1) return tiers[0].tier

  // Sort by price and return the middle one
  const sortedByPrice = [...tiers].sort((a, b) => {
    const priceA = a.monthly_price ?? 0
    const priceB = b.monthly_price ?? 0
    return priceA - priceB
  })

  const middleIndex = Math.floor(sortedByPrice.length / 2)
  return sortedByPrice[middleIndex].tier
}

/**
 * Check if a tier supports subgraphs
 */
export function supportsSubgraphs(tier: GraphTier): boolean {
  return tier.max_subgraphs !== null && tier.max_subgraphs > 0
}

/**
 * Format tier for display in dropdown or selection
 */
export function formatTierForDisplay(tier: GraphTier): string {
  const price = tier.monthly_price ? `$${tier.monthly_price}/mo` : ''
  return `${tier.display_name} ${price}`.trim()
}
