import type { ComponentType, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

interface EmptyStateProps {
  /** Icon shown above the title — typically a react-icons `Hi*` component. */
  icon: ComponentType<{ className?: string }>
  title: string
  description?: ReactNode
  /** Optional call-to-action (e.g. a "Create…" button) shown below. */
  action?: ReactNode
  /** Override the container spacing (default `py-12`). */
  className?: string
}

/**
 * The shared empty state: a muted icon, a title, an optional description, and an
 * optional action — centered. Render it inside whatever container the page uses
 * (often a `<Card>`); this component is just the centered inner block.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={twMerge('py-12 text-center', className)}>
      <Icon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
