import { Alert, Badge, Card, Spinner } from 'flowbite-react'
import { useEffect, useState } from 'react'
import { HiCheckCircle, HiInformationCircle } from 'react-icons/hi'
import {
  fetchGraphTiers,
  getPopularTier,
  getTierColor,
  type GraphTier,
} from '../../../lib/graph-tiers'
import { customTheme } from '../../../theme'
import type { GraphFormData } from '../types'

interface TierSelectionStepProps {
  selectedTier?: GraphFormData['selectedTier']
  onTierChange: (tier: NonNullable<GraphFormData['selectedTier']>) => void
}

export function TierSelectionStep({
  selectedTier = 'ladybug-standard',
  onTierChange,
}: TierSelectionStepProps) {
  const [tiers, setTiers] = useState<GraphTier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Valid tier values from the form data type
  const VALID_TIERS = [
    'ladybug-standard',
    'ladybug-large',
    'ladybug-xlarge',
    'neo4j-community-large',
    'neo4j-enterprise-xlarge',
  ] as const

  // Runtime validation for tier selection
  const handleTierChange = (tierValue: string) => {
    if (VALID_TIERS.includes(tierValue as any)) {
      onTierChange(tierValue as NonNullable<GraphFormData['selectedTier']>)
    } else {
      console.warn(`Invalid tier value: ${tierValue}. Skipping selection.`)
    }
  }

  useEffect(() => {
    const loadTiers = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchGraphTiers(false)
        setTiers(response.tiers)
      } catch (err) {
        console.error('Failed to load graph tiers:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load tier configurations'
        )
      } finally {
        setLoading(false)
      }
    }

    loadTiers()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="xl" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert theme={customTheme.alert} color="failure">
        <p className="font-semibold">Failed to load tier configurations</p>
        <p className="text-sm">{error}</p>
      </Alert>
    )
  }

  if (tiers.length === 0) {
    return (
      <Alert theme={customTheme.alert} color="warning">
        <p>No tier configurations available. Please contact support.</p>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
        <div className="flex gap-3">
          <HiInformationCircle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              AI Credits System
            </h4>
            <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
              Credits are consumed only when RoboSystems invokes AI models
              (Anthropic, OpenAI) on your behalf—such as our intelligent agents,
              natural language processing, or AI-powered analysis. All direct
              database operations, Cypher queries, data imports/exports, and API
              calls are completely free, including MCP tool calls that don't
              trigger AI processing.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.tier
          const isPopular = tier.tier === getPopularTier(tiers)
          const color = getTierColor(tier, tiers)

          return (
            <Card
              key={tier.tier}
              theme={customTheme.card}
              className={`relative cursor-pointer transition-all ${
                isSelected
                  ? color === 'info'
                    ? 'ring-primary-500 dark:ring-primary-400 ring-2'
                    : color === 'warning'
                      ? 'ring-accent-500 dark:ring-accent-400 ring-2'
                      : 'ring-secondary-500 dark:ring-secondary-400 ring-2'
                  : 'hover:shadow-lg'
              }`}
              onClick={() => handleTierChange(tier.tier)}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge color={color} size="sm">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-heading text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {tier.display_name}
                  </h3>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${tier.monthly_price || '0'}
                    </span>
                    <span className="text-base text-gray-500 dark:text-gray-400">
                      /month
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {tier.monthly_credits.toLocaleString()} AI credits/mo
                  </p>
                </div>

                <ul className="space-y-2.5">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <HiCheckCircle
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          color === 'info'
                            ? 'text-blue-500 dark:text-blue-400'
                            : color === 'warning'
                              ? 'text-orange-500 dark:text-orange-400'
                              : 'text-purple-500 dark:text-purple-400'
                        }`}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <div className="text-center">
                    <Badge color={color} size="lg">
                      Selected
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
