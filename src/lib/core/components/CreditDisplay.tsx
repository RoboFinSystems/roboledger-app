'use client'

import { Badge, Progress, Spinner } from 'flowbite-react'
import { FaBolt, FaChartLine, FaClock } from 'react-icons/fa'
import { useCreditContext } from '../contexts/credit-context'

interface CreditDisplayProps {
  graphId?: string
  showDetails?: boolean
  className?: string
}

export function CreditDisplay({
  graphId,
  showDetails = false,
  className = '',
}: CreditDisplayProps) {
  const {
    currentGraphCredits,
    currentGraphId,
    graphCredits,
    isLoadingGraphCredits,
    consumptionRate,
    getCreditPercentage,
  } = useCreditContext()
  // Always show credits - visibility check removed

  // Use provided graphId or current graph
  const targetGraphId = graphId || currentGraphId
  const credits = targetGraphId
    ? graphCredits.get(targetGraphId) || currentGraphCredits
    : currentGraphCredits

  const isLoading = targetGraphId
    ? isLoadingGraphCredits.get(targetGraphId)
    : false

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Spinner size="sm" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Loading credits...
        </span>
      </div>
    )
  }

  if (!credits) {
    return null
  }

  const percentage = getCreditPercentage(targetGraphId || '')
  const remainingCredits = credits.current_balance
  const totalCredits = credits.monthly_limit

  // Determine color based on percentage
  const getColor = () => {
    if (percentage >= 50) return 'success'
    if (percentage >= 20) return 'warning'
    return 'failure'
  }

  const color = getColor()

  if (!showDetails) {
    // Compact view - improved colors for dark mode
    const iconColorClass =
      color === 'success'
        ? 'text-green-500 dark:text-green-400'
        : color === 'warning'
          ? 'text-yellow-500 dark:text-yellow-400'
          : 'text-red-500 dark:text-red-400'

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <FaBolt className={`h-4 w-4 ${iconColorClass}`} />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {remainingCredits.toLocaleString()} credits
        </span>
        {percentage < 20 && (
          <Badge color="failure" size="xs">
            Low
          </Badge>
        )}
      </div>
    )
  }

  // Detailed view
  const detailIconColorClass =
    color === 'success'
      ? 'text-green-500'
      : color === 'warning'
        ? 'text-yellow-500'
        : 'text-red-500'

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaBolt className={`h-5 w-5 ${detailIconColorClass}`} />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Credit Balance
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {credits.tier.charAt(0).toUpperCase() + credits.tier.slice(1)}{' '}
              Plan
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {remainingCredits.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            of {totalCredits.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {percentage.toFixed(0)}% remaining
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {credits.consumed_this_month.toLocaleString()} used
          </span>
        </div>
        <Progress progress={percentage} color={color} size="sm" />
      </div>

      {consumptionRate > 0 && (
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <FaChartLine className="h-3 w-3" />
            <span>{consumptionRate.toFixed(1)} credits/hour</span>
          </div>
          {credits.reset_date && (
            <div className="flex items-center gap-1">
              <FaClock className="h-3 w-3" />
              <span>
                Resets {new Date(credits.reset_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}

      {percentage < 10 && (
        <div className="rounded-md bg-red-50 p-2 dark:bg-red-900/20">
          <p className="text-xs text-red-800 dark:text-red-200">
            ⚠️ Credits running low. Consider upgrading your plan.
          </p>
        </div>
      )}
    </div>
  )
}

// Minimal credit badge for navbar/sidebar
export function CreditBadge({ className = '' }: { className?: string }) {
  const { currentGraphCredits, getCreditPercentage, currentGraphId } =
    useCreditContext()
  // Always show credits - visibility check removed

  if (!currentGraphCredits || !currentGraphId) {
    return null
  }

  const percentage = getCreditPercentage(currentGraphId)
  const color =
    percentage >= 50 ? 'success' : percentage >= 20 ? 'warning' : 'failure'

  return (
    <Badge color={color} size="sm" className={className}>
      <FaBolt className="mr-1 h-3 w-3" />
      {currentGraphCredits.current_balance.toLocaleString()}
    </Badge>
  )
}
