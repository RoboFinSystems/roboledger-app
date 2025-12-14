'use client'

import { Alert, Badge } from 'flowbite-react'
import { HiExclamation, HiInformationCircle } from 'react-icons/hi'
import { useCreditContext } from '../contexts/credit-context'

interface CreditCostPreviewProps {
  operationType: string
  baseCost: number
  graphId?: string
  showWarning?: boolean
  className?: string
}

export function CreditCostPreview({
  operationType,
  baseCost,
  graphId,
  showWarning = true,
  className = '',
}: CreditCostPreviewProps) {
  const { currentGraphCredits, graphCredits } = useCreditContext()

  // Use provided graphId or current graph
  const credits = graphId ? graphCredits.get(graphId) : currentGraphCredits

  if (!credits) {
    return null
  }

  const actualCost = baseCost * credits.credit_multiplier
  const canAfford = credits.current_balance >= actualCost
  const percentageOfBalance = (actualCost / credits.current_balance) * 100

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {operationType} cost:
        </span>
        <div className="flex items-center space-x-2">
          <Badge color={canAfford ? 'success' : 'failure'} size="sm">
            {actualCost.toFixed(1)} credits
          </Badge>
          {credits.credit_multiplier > 1 && (
            <span className="text-xs text-gray-500">
              ({baseCost} × {credits.credit_multiplier}x)
            </span>
          )}
        </div>
      </div>

      {showWarning && !canAfford && (
        <Alert color="failure" icon={HiExclamation}>
          <span className="text-sm">
            Insufficient credits. You need {actualCost.toFixed(1)} but only have{' '}
            {credits.current_balance.toFixed(1)}.
          </span>
        </Alert>
      )}

      {showWarning && canAfford && percentageOfBalance > 10 && (
        <Alert color="warning" icon={HiInformationCircle}>
          <span className="text-sm">
            This will use {percentageOfBalance.toFixed(0)}% of your remaining
            credits.
          </span>
        </Alert>
      )}
    </div>
  )
}

interface OperationCost {
  operation: string
  baseCost: number
}

interface CreditCostTableProps {
  operations: OperationCost[]
  graphId?: string
  className?: string
}

export function CreditCostTable({
  operations,
  graphId,
  className = '',
}: CreditCostTableProps) {
  const { currentGraphCredits, graphCredits } = useCreditContext()

  const credits = graphId ? graphCredits.get(graphId) : currentGraphCredits

  if (!credits) {
    return null
  }

  const totalBaseCost = operations.reduce((sum, op) => sum + op.baseCost, 0)
  const totalActualCost = totalBaseCost * credits.credit_multiplier
  const canAfford = credits.current_balance >= totalActualCost

  return (
    <div className={`rounded-lg bg-gray-50 p-4 dark:bg-zinc-800 ${className}`}>
      <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Credit Cost Breakdown
      </h4>

      <div className="space-y-2">
        {operations.map((op, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {op.operation}
            </span>
            <span className="font-medium">
              {(op.baseCost * credits.credit_multiplier).toFixed(1)}
            </span>
          </div>
        ))}

        <div className="mt-2 border-t pt-2">
          <div className="flex justify-between">
            <span className="font-semibold">Total Cost</span>
            <Badge color={canAfford ? 'success' : 'failure'}>
              {totalActualCost.toFixed(1)} credits
            </Badge>
          </div>
        </div>
      </div>

      {credits.graph_tier !== 'standard' && (
        <div className="mt-3 text-center text-xs text-gray-500">
          {credits.graph_tier} tier: {credits.credit_multiplier}x multiplier
          applied
        </div>
      )}
    </div>
  )
}
