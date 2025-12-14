'use client'

import { DarkThemeToggle, Tooltip } from 'flowbite-react'
import { customTheme } from '../../theme'

export interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  return (
    <div className={className}>
      <div className="hidden dark:block">
        <Tooltip content="Toggle light mode" theme={customTheme.tooltip}>
          <DarkThemeToggle />
        </Tooltip>
      </div>
      <div className="dark:hidden">
        <Tooltip content="Toggle dark mode" theme={customTheme.tooltip}>
          <DarkThemeToggle />
        </Tooltip>
      </div>
    </div>
  )
}
