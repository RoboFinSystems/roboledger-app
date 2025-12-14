'use client'

import { Dropdown, DropdownItem } from 'flowbite-react'
import { HiViewGrid } from 'react-icons/hi'
import { getAppConfig } from '../auth-core/config'
import { useSSO } from '../auth-core/sso'
import type { AppConfig } from '../auth-core/types'
import { useToast } from '../hooks/use-toast'
import { customTheme } from '../theme'

export interface AppSwitcherProps {
  apiUrl: string
  currentApp?: string
  className?: string
}

export function AppSwitcher({
  apiUrl,
  currentApp,
  className = '',
}: AppSwitcherProps) {
  const { navigateToApp, getAvailableApps } = useSSO(apiUrl)
  const { showError, ToastContainer } = useToast()
  const availableApps = getAvailableApps().filter(
    (app) => app.name !== currentApp
  )

  const handleAppClick = async (app: AppConfig) => {
    try {
      await navigateToApp(app.name)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[SSO] Navigation to ${app.name} failed:`, error)
      }
      showError(`Failed to navigate to ${app.displayName}. Please try again.`)
    }
  }

  if (availableApps.length === 0) {
    return null
  }

  return (
    <>
      <ToastContainer />
      <div className={className}>
        <Dropdown
          theme={{
            ...customTheme.dropdown,
            floating: {
              ...customTheme.dropdown.floating,
              base: `${customTheme.dropdown.floating.base} z-50!`,
            },
          }}
          className="w-64"
          arrowIcon={false}
          inline
          label={
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm text-gray-500 hover:bg-zinc-100 focus:ring-2 focus:ring-gray-200 focus:outline-hidden dark:text-gray-400 dark:hover:bg-zinc-700 dark:focus:ring-gray-600">
              <HiViewGrid className="h-5 w-5" />
            </span>
          }
        >
          {availableApps.map((app) => (
            <DropdownItem
              key={app.name}
              theme={customTheme.dropdown.floating.item}
              onClick={() => handleAppClick(app)}
              className="flex w-full items-center space-x-3 p-3"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-sm ${getAppConfig(app.name).colorClass}`}
              >
                <span className="text-xs font-bold text-white">
                  {getAppConfig(app.name).initials}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-left text-sm font-medium text-gray-900 dark:text-white">
                  {app.displayName}
                </p>
                <p className="truncate text-left text-xs text-gray-500 dark:text-gray-400">
                  {app.description}
                </p>
              </div>
            </DropdownItem>
          ))}
        </Dropdown>
      </div>
    </>
  )
}
