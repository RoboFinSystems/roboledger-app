'use client'

import { formatFetchedLabel } from '@/lib/relative-time'
import { Button } from 'flowbite-react'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { HiRefresh } from 'react-icons/hi'

interface RefreshControlProps {
  onRefresh: () => void
  isRefreshing: boolean
  fetchedAt: Date | null
  disabled?: boolean
}

/**
 * Quiet last-fetched + reload chrome for long-open reading surfaces.
 * The page owns the fetch; this control does not poll.
 */
const RefreshControl: FC<RefreshControlProps> = ({
  onRefresh,
  isRefreshing,
  fetchedAt,
  disabled = false,
}) => {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!fetchedAt) return
    const id = window.setInterval(() => setNow(new Date()), 15_000)
    return () => window.clearInterval(id)
  }, [fetchedAt])

  const label = formatFetchedLabel(fetchedAt, now)
  const isDisabled = disabled || isRefreshing

  return (
    <div className="flex items-center gap-2" data-testid="refresh-control">
      <Button
        type="button"
        size="xs"
        color="light"
        onClick={onRefresh}
        disabled={isDisabled}
        title="Refresh"
        aria-label="Refresh"
        aria-busy={isRefreshing}
      >
        <HiRefresh
          className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
        />
        <span className="sr-only">Refresh</span>
      </Button>
      {label && (
        <span
          className="text-xs whitespace-nowrap text-gray-400 tabular-nums dark:text-gray-500"
          data-testid="fetched-at"
        >
          {label}
        </span>
      )}
    </div>
  )
}

export default RefreshControl
