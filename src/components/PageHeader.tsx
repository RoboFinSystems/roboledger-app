'use client'

import type { ComponentType, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

interface PageHeaderProps {
  icon: ComponentType<{ className?: string }>
  title: string
  description?: string
  actions?: ReactNode
  gradient?: string
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
  gradient = 'from-blue-500 to-purple-600',
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className={twMerge('rounded-lg bg-gradient-to-br p-3', gradient)}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}
