import { Card } from 'flowbite-react'
import type { ComponentType, ReactNode } from 'react'
import { customTheme } from '../theme'

interface StatCardProps {
  /** Short muted label above the value, e.g. "Total Graphs". */
  label: string
  /** The metric value — a formatted string/number (include any unit, e.g. "1.2 GB"). */
  value: ReactNode
  /** Optional icon, rendered muted and right-aligned. */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  /** Extra classes forwarded to the Card wrapper (e.g. a column span). */
  className?: string
}

/**
 * A dashboard stat tile: a muted label over a large bold value, in a Card.
 * Drop several into a `grid` to form a metrics row. Pass an `icon` to get the
 * value-left / icon-right layout.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <Card theme={customTheme.card} className={className}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </div>
        </div>
        {Icon && (
          <Icon
            className="h-10 w-10 shrink-0 text-gray-300 dark:text-gray-600"
            aria-hidden="true"
          />
        )}
      </div>
    </Card>
  )
}
