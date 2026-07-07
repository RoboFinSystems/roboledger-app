'use client'

import { DarkThemeToggle, Tooltip } from 'flowbite-react'

export interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  return (
    <div className={className}>
      <div className="hidden dark:block">
        <Tooltip content="Toggle light mode">
          <DarkThemeToggle />
        </Tooltip>
      </div>
      <div className="dark:hidden">
        <Tooltip content="Toggle dark mode">
          <DarkThemeToggle />
        </Tooltip>
      </div>
    </div>
  )
}
