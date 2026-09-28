'use client'

import {
  CONSOLE_DRAWER_HEIGHT_VAR,
  ConsoleDrawer,
  useGraphAwareConsoleConfig,
  useSidebarContext,
} from '@robosystems/core'
import type { PropsWithChildren } from 'react'
import { twMerge } from 'tailwind-merge'

import { ROBOLEDGER_CONSOLE_BRANDING } from '@/lib/console-branding'

export function LayoutContent({ children }: PropsWithChildren) {
  const sidebar = useSidebarContext()
  const consoleConfig = useGraphAwareConsoleConfig(ROBOLEDGER_CONSOLE_BRANDING)
  const collapsed = sidebar.desktop.isCollapsed

  return (
    <>
      <div
        id="main-content"
        className={twMerge(
          'relative h-full w-full overflow-y-auto bg-zinc-50 dark:bg-black',
          collapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
        style={{ paddingBottom: `var(${CONSOLE_DRAWER_HEIGHT_VAR}, 0px)` }}
      >
        {children}
      </div>
      {/* The one way into the console, on every page. */}
      <ConsoleDrawer
        config={consoleConfig}
        className={twMerge(
          'right-0 left-0',
          collapsed ? 'lg:left-16' : 'lg:left-64'
        )}
      />
    </>
  )
}
