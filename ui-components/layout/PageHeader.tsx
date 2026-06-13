'use client'

import type { ComponentType, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

export interface PageHeaderProps {
  /**
   * Icon rendered in white on the brand-gradient chip — typically a
   * react-icons `Hi*` component, e.g. `icon={HiHome}`.
   */
  icon: ComponentType<{ className?: string }>
  title: string
  subtitle?: ReactNode
  /** Optional right-aligned content (buttons, menus). */
  actions?: ReactNode
  /** Extra classes on the outer wrapper, e.g. `mb-6`. */
  className?: string
}

/**
 * The standard page header used across the authenticated app: a white icon on
 * the app's brand-gradient chip, a title, an optional subtitle, and optional
 * right-aligned actions. The gradient is driven by the `primary`/`secondary`
 * Tailwind tokens, so it reskins to each app's brand automatically.
 */
export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={twMerge('flex items-start justify-between gap-4', className)}
    >
      <div className="flex items-center gap-4">
        <div className="from-primary-500 to-secondary-600 shrink-0 rounded-lg bg-gradient-to-br p-3">
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}
