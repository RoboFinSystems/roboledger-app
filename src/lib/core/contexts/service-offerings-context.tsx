'use client'

import type { ServiceOfferingsResponse } from '@robosystems/client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { SDK } from '..'

// Re-export SDK type for direct usage
export type { ServiceOfferingsResponse }

// Transform SDK response to camelCase for frontend compatibility
export interface ServiceOfferings {
  billingEnabled: boolean
  graphPlans?: {
    [key: string]: {
      name: string
      displayName: string
      monthlyPrice: number
      monthlyCredits: number
      features: string[]
      limits?: {
        maxNodes?: number
        maxRelationships?: number
        maxStorageGb?: number
      }
      creditMultiplier: number
    }
  }
  repositoryPlans?: {
    [repositoryType: string]: {
      name: string
      description: string
      enabled: boolean
      comingSoon?: boolean
      plans: Array<{
        plan: string
        name: string
        monthlyPrice: number
        monthlyCredits: number
        features?: string[]
      }>
    }
  }
  features?: {
    [key: string]: any
  }
}

interface ServiceOfferingsContextValue {
  offerings: ServiceOfferings | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const ServiceOfferingsContext = createContext<ServiceOfferingsContextValue>({
  offerings: null,
  isLoading: true,
  error: null,
  refresh: async () => {},
})

export function ServiceOfferingsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [offerings, setOfferings] = useState<ServiceOfferings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOfferings = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await SDK.getServiceOfferings()

      if (response.data) {
        // Transform the API response to match our expected structure
        const apiData = response.data as any

        // Transform repository_subscriptions.repositories array into repositoryPlans object
        const repositoryPlans: ServiceOfferings['repositoryPlans'] = {}

        if (apiData.repository_subscriptions?.repositories) {
          apiData.repository_subscriptions.repositories.forEach((repo: any) => {
            repositoryPlans[repo.type] = {
              name: repo.name,
              description: repo.description,
              enabled: repo.enabled,
              comingSoon: repo.coming_soon,
              plans: repo.plans.map((plan: any) => ({
                plan: plan.plan,
                name: plan.name,
                monthlyPrice: plan.monthly_price,
                monthlyCredits: plan.monthly_credits,
                features: plan.features,
              })),
            }
          })
        }

        // Transform graph tiers array into graphPlans object
        const graphPlans: ServiceOfferings['graphPlans'] = {}

        if (apiData.graph_subscriptions?.tiers) {
          apiData.graph_subscriptions.tiers.forEach((tier: any) => {
            // Skip trial tier for selection
            if (tier.name === 'trial') return

            graphPlans[tier.name] = {
              name: tier.name,
              displayName: tier.display_name,
              monthlyPrice: tier.monthly_price,
              monthlyCredits: tier.monthly_credits,
              features: tier.features || [],
              creditMultiplier:
                apiData.graph_subscriptions?.tier_multipliers?.[tier.name] || 1,
              limits: {
                maxStorageGb: tier.max_storage_gb,
                maxNodes: tier.max_nodes,
                maxRelationships: tier.max_relationships,
              },
            }
          })
        }

        const offerings: ServiceOfferings = {
          billingEnabled: apiData.billing_enabled ?? true,
          repositoryPlans,
          graphPlans,
          features: apiData.features,
        }

        setOfferings(offerings)
      } else {
        throw new Error('No data received from service offerings API')
      }
    } catch (err) {
      console.error('Failed to fetch service offerings:', err)
      setError('Failed to load service offerings')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOfferings()
  }, [])

  return (
    <ServiceOfferingsContext.Provider
      value={{
        offerings,
        isLoading,
        error,
        refresh: fetchOfferings,
      }}
    >
      {children}
    </ServiceOfferingsContext.Provider>
  )
}

export function useServiceOfferings() {
  const context = useContext(ServiceOfferingsContext)
  if (!context) {
    throw new Error(
      'useServiceOfferings must be used within ServiceOfferingsProvider'
    )
  }
  return context
}
