'use client'

import {
  CONSOLE_DRAWER_HEIGHT_VAR,
  ConsoleDrawer,
  useGraphAwareConsoleConfig,
  useSidebarContext,
} from '@robosystems/core'
import { usePathname } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import { twMerge } from 'tailwind-merge'

import { ROBOLEDGER_CONSOLE_BRANDING } from '@/lib/console-branding'

export function LayoutContent({ children }: PropsWithChildren) {
  const sidebar = useSidebarContext()
  const consoleConfig = useGraphAwareConsoleConfig(ROBOLEDGER_CONSOLE_BRANDING)
  // The console page is the console; a second one docked under it is noise.
  const showDrawer = usePathname() !== '/console'
  const collapsed = sidebar.desktop.isCollapsed

  return (
    <>
      <div
        id="main-content"
        className={twMerge(
          'relative h-full w-full overflow-y-auto bg-zinc-50 dark:bg-black',
          collapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
        style={
          showDrawer
            ? { paddingBottom: `var(${CONSOLE_DRAWER_HEIGHT_VAR}, 0px)` }
            : undefined
        }
      >
        {children}
      </div>
      {showDrawer && (
        <ConsoleDrawer
          config={consoleConfig}
          className={twMerge(
            'right-0 left-0',
            collapsed ? 'lg:left-16' : 'lg:left-64'
          )}
        />
      )}
    </>
  )
}
