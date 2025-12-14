'use client'

import type { ButtonProps } from 'flowbite-react'
import { Button, Spinner, Tooltip } from 'flowbite-react'
import { useState } from 'react'
import { HiExclamation, HiLightningBolt } from 'react-icons/hi'
import {
  useCreditAwareOperation,
  useCreditContext,
} from '../contexts/credit-context'

interface CreditAwareButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => Promise<any>
  operationType: string
  baseCost: number
  graphId?: string
  showCost?: boolean
  confirmThreshold?: number // Percentage of balance to trigger confirmation
  onSuccess?: (result: any) => void
  onError?: (error: any) => void
}

export function CreditAwareButton({
  onClick,
  operationType,
  baseCost,
  graphId,
  showCost = true,
  confirmThreshold = 25,
  onSuccess,
  onError,
  children,
  disabled,
  ...buttonProps
}: CreditAwareButtonProps) {
  const { currentGraphCredits, graphCredits, currentGraphId } =
    useCreditContext()
  const { executeWithCredits } = useCreditAwareOperation()
  const [isLoading, setIsLoading] = useState(false)

  const targetGraphId = graphId || currentGraphId
  const credits = targetGraphId
    ? graphCredits.get(targetGraphId)
    : currentGraphCredits

  if (!credits || !targetGraphId) {
    return (
      <Tooltip content="No graph selected">
        <Button disabled {...buttonProps}>
          {children}
        </Button>
      </Tooltip>
    )
  }

  const actualCost = baseCost * credits.credit_multiplier
  const canAfford = credits.current_balance >= actualCost
  const percentageOfBalance = (actualCost / credits.current_balance) * 100
  const needsConfirmation = percentageOfBalance > confirmThreshold

  const handleClick = async () => {
    if (!canAfford) return

    if (needsConfirmation) {
      const confirmed = window.confirm(
        `This operation will consume ${actualCost.toFixed(1)} credits (${percentageOfBalance.toFixed(0)}% of your balance). Continue?`
      )
      if (!confirmed) return
    }

    setIsLoading(true)
    try {
      const result = await executeWithCredits(onClick, operationType, baseCost)
      if (result !== null && onSuccess) {
        onSuccess(result)
      }
    } catch (error) {
      if (onError) {
        onError(error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const buttonContent = (
    <>
      {isLoading ? (
        <Spinner size="sm" className="mr-2" />
      ) : showCost ? (
        <HiLightningBolt className="mr-1 h-4 w-4" />
      ) : null}
      {children}
      {showCost && !isLoading && (
        <span className="ml-2 text-xs opacity-75">
          (-{actualCost.toFixed(1)})
        </span>
      )}
    </>
  )

  if (!canAfford) {
    return (
      <Tooltip
        content={`Insufficient credits. Need ${actualCost.toFixed(1)}, have ${credits.current_balance.toFixed(1)}`}
      >
        <Button disabled color="failure" {...buttonProps}>
          <HiExclamation className="mr-1 h-4 w-4" />
          {children}
        </Button>
      </Tooltip>
    )
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading || !canAfford}
      {...buttonProps}
    >
      {buttonContent}
    </Button>
  )
}
