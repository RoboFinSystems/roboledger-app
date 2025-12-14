'use client'

import type { PropsWithChildren } from 'react'

interface SettingsContainerProps extends PropsWithChildren {
  className?: string
}

/**
 * Standardized container for settings pages
 * Ensures consistent spacing and layout across all settings implementations
 */
export function SettingsContainer({
  children,
  className = '',
}: SettingsContainerProps) {
  return (
    <div className={`grid grid-cols-1 gap-6 px-4 pb-1 ${className}`}>
      {children}
    </div>
  )
}
