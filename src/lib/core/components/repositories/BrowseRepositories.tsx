'use client'

import * as SDK from '@robosystems/client'
import { Badge, Button, Card, Spinner } from 'flowbite-react'
import { useCallback, useEffect, useState } from 'react'
import {
  HiCheckCircle,
  HiDatabase,
  HiGlobeAlt,
  HiInformationCircle,
} from 'react-icons/hi'
import { useGraphContext } from '../../contexts/graph-context'
import { useOrg } from '../../contexts/org-context'
import { useServiceOfferings } from '../../contexts/service-offerings-context'
import { useToast } from '../../hooks/use-toast'
import { useRepositorySubscription } from '../../task-monitoring/operationHooks'
import { customTheme } from '../../theme'

// Use the SDK type directly - id field contains the subscription ID
type SubscriptionInfo = SDK.GraphSubscriptionResponse

// Type for repository plan from offerings
type RepositoryPlan = {
  enabled: boolean
  comingSoon?: boolean
  name: string
  description: string
  plans: Array<{
    plan: string
    name: string
    price: number
    monthlyPrice: number
    credits: number
    monthlyCredits: number
    features: string[]
  }>
}

export interface BrowseRepositoriesProps {
  /** Called after successful subscription with the repository type */
  onSubscribed?: (repositoryType: string) => void
  /** Called when user wants to view their subscriptions */
  onViewSubscriptions?: () => void
  /** Called when user wants to upgrade a plan */
  onUpgrade?: (repositoryType: string, planName: string) => void
  /** Whether to show the header section */
  showHeader?: boolean
  /** Whether to show the "How it Works" info card */
  showInfoCard?: boolean
}

export function BrowseRepositories({
  onSubscribed,
  onViewSubscriptions,
  onUpgrade,
  showHeader = true,
  showInfoCard = true,
}: BrowseRepositoriesProps) {
  const [userSubscriptions, setUserSubscriptions] = useState<
    SubscriptionInfo[]
  >([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const { showSuccess, showError, ToastContainer } = useToast()
  const { currentOrg } = useOrg()
  const { offerings, isLoading: offeringsLoading } = useServiceOfferings()
  const repositorySubscription = useRepositorySubscription()
  const { setCurrentGraph, refreshGraphs } = useGraphContext()

  const loadData = useCallback(async () => {
    if (!currentOrg?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Load org subscriptions and filter for repositories
      const subscriptionsResponse = await SDK.listOrgSubscriptions({
        path: { org_id: currentOrg.id },
      })

      if (subscriptionsResponse.data) {
        const repositorySubscriptions = (
          subscriptionsResponse.data || []
        ).filter(
          (sub: SDK.GraphSubscriptionResponse) =>
            sub.resource_type === 'repository'
        )
        setUserSubscriptions(repositorySubscriptions as SubscriptionInfo[])
      } else {
        setUserSubscriptions([])
      }
    } catch (error) {
      console.error('Failed to load user subscriptions:', error)
      showError('Failed to load user subscriptions')
    } finally {
      setLoading(false)
    }
  }, [currentOrg?.id, showError])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSubscribe = async (repositoryType: string, tier: string) => {
    if (!currentOrg?.id) {
      showError('No organization found')
      return
    }

    try {
      setSubscribing(`${repositoryType}-${tier}`)

      const result = await repositorySubscription.subscribe({
        repository_name: repositoryType,
        plan_name: tier,
        org_id: currentOrg.id,
      })

      // If result indicates checkout is required, the hook will have already redirected
      if (result && 'requires_checkout' in result) {
        return
      }

      showSuccess('Successfully subscribed to repository!')

      // Reload subscriptions
      await loadData()

      // Refresh the graphs list to include the new repository
      await refreshGraphs()

      // Set the repository as the current graph context
      await setCurrentGraph(repositoryType)

      // Notify parent
      onSubscribed?.(repositoryType)
    } catch (error) {
      console.error('Failed to subscribe:', error)
      showError(
        error instanceof Error
          ? error.message
          : 'Failed to subscribe to repository'
      )
    } finally {
      setSubscribing(null)
    }
  }

  const isSubscribed = (repositoryName: string, tier: string) => {
    return userSubscriptions.some(
      (sub) =>
        sub.resource_id === repositoryName &&
        sub.plan_name.toLowerCase() === tier.toLowerCase() &&
        sub.status === 'active'
    )
  }

  const getUserSubscription = (repositoryName: string) => {
    return userSubscriptions.find(
      (sub) => sub.resource_id === repositoryName && sub.status === 'active'
    )
  }

  if (loading || offeringsLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="xl" />
      </div>
    )
  }

  // Check if user has any active subscriptions
  const hasActiveSubscriptions = userSubscriptions.some(
    (sub) => sub.status === 'active'
  )

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      {showHeader && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-3">
              <HiGlobeAlt className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Browse Repositories
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Subscribe to read-only graph databases containing curated data
              </p>
            </div>
          </div>
          {hasActiveSubscriptions && onViewSubscriptions && (
            <Button onClick={onViewSubscriptions} color="gray">
              View My Subscriptions
            </Button>
          )}
        </div>
      )}

      {/* How it Works Card */}
      {showInfoCard && (
        <Card theme={customTheme.card}>
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
              <HiInformationCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading mb-3 text-lg font-semibold text-zinc-900 dark:text-white">
                How Shared Repositories Work
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Subscribe to gain read-only access to curated graph
                    databases
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Credits are used for AI agent calls - queries are unlimited
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Generate API keys to access repositories via MCP tools in AI
                    apps
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Different tiers offer varying credit limits and features
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Available Repositories */}
      {offerings?.repositoryPlans &&
        Object.entries(offerings.repositoryPlans)
          .filter(([_, repo]) => {
            const repoData = repo as RepositoryPlan
            return repoData.enabled && !repoData.comingSoon
          })
          .map(([repoType, repo]) => {
            const repoData = repo as RepositoryPlan
            const userSub = getUserSubscription(repoType)

            return (
              <Card
                key={repoType}
                theme={customTheme.card}
                className="overflow-hidden"
              >
                <div className="space-y-6">
                  {/* Repository Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-3">
                        <HiDatabase className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="font-heading text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                          {repoData.name}
                        </h2>
                        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                          {repoData.description}
                        </p>
                      </div>
                    </div>
                    {userSub && (
                      <Badge color="success" icon={HiCheckCircle} size="lg">
                        Active - {userSub.plan_display_name}
                      </Badge>
                    )}
                  </div>

                  {/* Pricing Plans */}
                  <div
                    className={`grid gap-6 ${
                      repoData.plans.length === 2
                        ? 'mx-auto max-w-3xl lg:grid-cols-2'
                        : 'lg:grid-cols-3'
                    }`}
                  >
                    {repoData.plans.map((plan, index) => {
                      const isCurrentPlan =
                        userSub?.plan_name.toLowerCase() ===
                        plan.plan.toLowerCase()
                      const isSubscribedPlan = isSubscribed(repoType, plan.plan)
                      const isPopular = index === 1

                      return (
                        <div
                          key={plan.plan}
                          className={`relative flex flex-col rounded-xl border-2 p-6 transition-all hover:shadow-lg ${
                            isCurrentPlan
                              ? 'border-blue-500 bg-blue-50 shadow-lg dark:bg-blue-900/20'
                              : isPopular
                                ? 'border-purple-500 bg-gradient-to-b from-purple-50 to-white shadow-md dark:from-purple-900/20 dark:to-zinc-800'
                                : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800'
                          }`}
                        >
                          {isPopular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <Badge color="purple" size="sm">
                                Most Popular
                              </Badge>
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="text-center">
                              <h3 className="font-heading mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                                {plan.name}
                              </h3>
                              <div className="mb-1">
                                <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                                  ${plan.monthlyPrice}
                                </span>
                                <span className="text-zinc-500 dark:text-zinc-400">
                                  /month
                                </span>
                              </div>
                              <p className="mb-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                {plan.monthlyCredits.toLocaleString()}{' '}
                                credits/month
                              </p>
                            </div>

                            {plan.features && (
                              <ul className="mb-6 space-y-2 text-sm">
                                {plan.features.map((feature, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2"
                                  >
                                    <HiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                                    <span className="text-zinc-600 dark:text-zinc-400">
                                      {feature}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div className="mt-6">
                            {isCurrentPlan ? (
                              <Button
                                color="gray"
                                disabled
                                className="w-full"
                                size="lg"
                              >
                                <HiCheckCircle className="mr-2 h-4 w-4" />
                                Current Plan
                              </Button>
                            ) : userSub &&
                              plan.plan.toLowerCase() !== 'basic' &&
                              onUpgrade ? (
                              <Button
                                onClick={() => onUpgrade(repoType, plan.plan)}
                                className="w-full"
                                size="lg"
                                color={isPopular ? 'purple' : 'blue'}
                              >
                                Upgrade to {plan.name}
                              </Button>
                            ) : (
                              <Button
                                onClick={() =>
                                  handleSubscribe(repoType, plan.plan)
                                }
                                disabled={
                                  subscribing === `${repoType}-${plan.plan}` ||
                                  isSubscribedPlan
                                }
                                className="w-full"
                                size="lg"
                                color={isPopular ? 'purple' : 'blue'}
                              >
                                {subscribing === `${repoType}-${plan.plan}`
                                  ? 'Subscribing...'
                                  : isSubscribedPlan
                                    ? 'Subscribed'
                                    : `Subscribe to ${plan.name}`}
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            )
          })}

      {(!offerings?.repositoryPlans ||
        Object.keys(offerings.repositoryPlans).filter(
          (key) =>
            offerings.repositoryPlans![key].enabled &&
            !offerings.repositoryPlans![key].comingSoon
        ).length === 0) && (
        <Card theme={customTheme.card}>
          <div className="py-8 text-center">
            <HiDatabase className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <p className="text-zinc-600 dark:text-zinc-400">
              No shared repositories available at this time
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
