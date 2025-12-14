import { Card } from 'flowbite-react'
import type { ComponentProps, FC } from 'react'
import React from 'react'

export interface SettingsCardProps {
  title: string
  description?: string
  icon?: FC<ComponentProps<'svg'>>
  children: React.ReactNode
  theme?: any
  className?: string
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  icon: Icon,
  children,
  theme,
  className = '',
}) => {
  return (
    <Card theme={theme} className={className}>
      <div className="mb-6">
        {Icon && (
          <div className="mb-4 flex items-start gap-3">
            <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
              <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {title}
              </h3>
              {description && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}
        {!Icon && (
          <>
            <h3 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {description}
              </p>
            )}
          </>
        )}
      </div>
      {children}
    </Card>
  )
}
