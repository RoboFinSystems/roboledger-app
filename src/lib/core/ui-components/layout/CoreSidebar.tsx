'use client'

import {
  Button,
  Sidebar,
  SidebarCollapse,
  SidebarItem,
  SidebarItemGroup,
  SidebarItems,
  Tooltip,
} from 'flowbite-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps, FC, HTMLAttributeAnchorTarget } from 'react'
import React from 'react'
import { HiCog, HiOfficeBuilding } from 'react-icons/hi'
import { twMerge } from 'tailwind-merge'
import { useOrg, useSidebarContext } from '../../contexts'
import { customTheme } from '../../theme'

export interface SidebarItemData {
  href?: string
  target?: HTMLAttributeAnchorTarget
  icon?: FC<ComponentProps<'svg'>>
  label: string
  items?: SidebarItemData[]
  badge?: string
}

interface SidebarItemProps extends SidebarItemData {
  pathname: string
}

export interface CoreSidebarProps {
  navigationItems: SidebarItemData[]
  features?: {
    aiChat?: boolean
    companyDropdown?: boolean
    showOrgSection?: boolean
  }
  bottomMenuActions?: {
    label: string
    icon: FC<ComponentProps<'svg'>>
    onClick: () => void
    tooltip: string
  }[]
  additionalMobileComponents?: React.ReactNode
  className?: string
  borderColorClass?: string
}

export function CoreSidebar({
  navigationItems,
  features = {},
  bottomMenuActions = [],
  additionalMobileComponents,
  className = '',
  borderColorClass = 'dark:border-gray-700',
}: CoreSidebarProps) {
  return (
    <>
      <div className="lg:hidden">
        <MobileSidebar
          navigationItems={navigationItems}
          features={features}
          bottomMenuActions={bottomMenuActions}
          additionalMobileComponents={additionalMobileComponents}
          borderColorClass={borderColorClass}
        />
      </div>
      <div className={`hidden lg:block ${className}`}>
        <DesktopSidebar
          navigationItems={navigationItems}
          features={features}
          bottomMenuActions={bottomMenuActions}
          borderColorClass={borderColorClass}
        />
      </div>
    </>
  )
}

interface SidebarComponentProps {
  navigationItems: SidebarItemData[]
  features: {
    aiChat?: boolean
    companyDropdown?: boolean
    showOrgSection?: boolean
  }
  bottomMenuActions: {
    label: string
    icon: FC<ComponentProps<'svg'>>
    onClick: () => void
    tooltip: string
  }[]
  additionalMobileComponents?: React.ReactNode
  borderColorClass: string
}

function DesktopSidebar({
  navigationItems,
  features,
  bottomMenuActions,
  borderColorClass,
}: Omit<SidebarComponentProps, 'additionalMobileComponents'>) {
  const pathname = usePathname()
  const { isCollapsed } = useSidebarContext().desktop

  return (
    <Sidebar
      aria-label="Sidebar with multi-level dropdown example"
      theme={customTheme.sidebar}
      collapsed={isCollapsed}
      className={twMerge(
        `fixed inset-y-0 left-0 z-20 flex h-full shrink-0 flex-col border-r border-gray-200 pt-16 duration-75 ${borderColorClass} lg:flex`
      )}
      id="sidebar"
    >
      <div className="flex h-full flex-col justify-between">
        <div className="py-2">
          <SidebarItems>
            <OrgSection
              isCollapsed={isCollapsed}
              showOrgSection={features.showOrgSection}
            />
            <SidebarItemGroup className="mt-0 border-t-0 pt-2 pb-1">
              {navigationItems.map((item) => (
                <CustomSidebarItem
                  key={item.label}
                  {...item}
                  pathname={pathname}
                />
              ))}
            </SidebarItemGroup>
          </SidebarItems>
        </div>
        <BottomMenu
          isCollapsed={isCollapsed}
          features={features}
          bottomMenuActions={bottomMenuActions}
        />
      </div>
    </Sidebar>
  )
}

function MobileSidebar({
  navigationItems,
  features,
  bottomMenuActions,
  additionalMobileComponents,
  borderColorClass,
}: SidebarComponentProps) {
  const pathname = usePathname()
  const { isOpen, close } = useSidebarContext().mobile

  if (!isOpen) return null

  return (
    <>
      <Sidebar
        aria-label="Sidebar with multi-level dropdown example"
        theme={customTheme.sidebar}
        className={twMerge(
          `fixed inset-y-0 left-0 z-20 hidden h-full shrink-0 flex-col border-r border-gray-200 pt-16 ${borderColorClass} lg:flex`,
          isOpen && 'flex'
        )}
        id="sidebar"
      >
        <div className="flex h-full flex-col justify-between">
          <div className="py-2">
            {additionalMobileComponents && (
              <div className="hidden pb-2 max-md:block">
                {additionalMobileComponents}
              </div>
            )}
            <SidebarItems>
              <OrgSection
                isCollapsed={false}
                showOrgSection={features.showOrgSection}
              />
              <SidebarItemGroup className="mt-0 border-t-0 pt-2 pb-1">
                {navigationItems.map((item) => (
                  <CustomSidebarItem
                    key={item.label}
                    {...item}
                    pathname={pathname}
                  />
                ))}
              </SidebarItemGroup>
            </SidebarItems>
          </div>
          <BottomMenu
            isCollapsed={false}
            features={features}
            bottomMenuActions={bottomMenuActions}
          />
        </div>
      </Sidebar>
      <div
        onClick={close}
        aria-hidden="true"
        className="fixed inset-0 z-10 h-full w-full bg-zinc-900/50 pt-16 dark:bg-zinc-900/90"
      />
    </>
  )
}

function CustomSidebarItem({
  href,
  target,
  icon: Icon,
  label,
  items,
  badge,
  pathname,
}: SidebarItemProps) {
  if (!items?.length) {
    const isExternal = target === '_blank' || href?.startsWith('http')

    if (isExternal) {
      return (
        <SidebarItem
          href={href || '#'}
          icon={Icon}
          active={pathname === href}
          theme={customTheme.sidebar.item}
          className={
            pathname === href
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-200 dark:text-primary-800'
              : ''
          }
        >
          {label}
        </SidebarItem>
      )
    }

    return (
      <SidebarItem
        as={Link}
        href={href || '#'}
        icon={Icon}
        active={pathname === href}
        theme={customTheme.sidebar.item}
        className={
          pathname === href
            ? 'bg-zinc-100 text-gray-900 dark:bg-zinc-800 dark:text-gray-200'
            : ''
        }
      >
        {label}
      </SidebarItem>
    )
  }

  return (
    <SidebarCollapse
      icon={Icon}
      label={label}
      theme={customTheme.sidebar.collapse}
      open={items.some((item) => pathname === item.href)}
    >
      {items.map((item) => {
        const isExternal =
          item.target === '_blank' || item.href?.startsWith('http')

        if (isExternal) {
          return (
            <SidebarItem
              key={item.label}
              href={item.href || '#'}
              active={pathname === item.href}
              theme={customTheme.sidebar.item}
              className={
                pathname === item.href
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-200 dark:text-primary-800'
                  : ''
              }
            >
              {item.label}
            </SidebarItem>
          )
        }

        return (
          <SidebarItem
            key={item.label}
            as={Link}
            href={item.href || '#'}
            active={pathname === item.href}
            theme={customTheme.sidebar.item}
            className={
              pathname === item.href
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-200 dark:text-primary-800'
                : ''
            }
          >
            {item.label}
          </SidebarItem>
        )
      })}
    </SidebarCollapse>
  )
}

function OrgSection({
  isCollapsed,
  showOrgSection = true,
}: {
  isCollapsed: boolean
  showOrgSection?: boolean
}) {
  const { currentOrg } = useOrg()
  const pathname = usePathname()
  const isActive = pathname === '/organization'

  if (!showOrgSection || !currentOrg) return null

  return (
    <SidebarItemGroup className="border-b border-gray-200 pb-2 dark:border-gray-700">
      <SidebarItem
        as={Link}
        href="/organization"
        icon={HiOfficeBuilding}
        active={isActive}
        theme={customTheme.sidebar.item}
        className={
          isActive
            ? 'bg-zinc-100 text-gray-900 dark:bg-zinc-800 dark:text-gray-200'
            : ''
        }
      >
        <span className="truncate text-sm">{currentOrg.name}</span>
      </SidebarItem>
    </SidebarItemGroup>
  )
}

interface BottomMenuProps {
  isCollapsed: boolean
  features: {
    aiChat?: boolean
    companyDropdown?: boolean
    showOrgSection?: boolean
  }
  bottomMenuActions: {
    label: string
    icon: FC<ComponentProps<'svg'>>
    onClick: () => void
    tooltip: string
  }[]
}

function BottomMenu({
  isCollapsed,
  features,
  bottomMenuActions,
}: BottomMenuProps) {
  return (
    <div
      className={`flex items-center justify-center border-t border-gray-200 px-4 py-4 dark:border-gray-700 ${
        isCollapsed ? 'flex-col gap-y-2' : 'gap-x-5'
      }`}
    >
      {/* Settings button (always present) */}
      <Tooltip content="Settings" theme={customTheme.tooltip}>
        <Button
          as={Link}
          href="/settings"
          color="ghost"
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <HiCog className="text-lg text-gray-500 dark:text-gray-400" />
        </Button>
      </Tooltip>

      {/* Custom bottom menu actions */}
      {bottomMenuActions.map((action, index) => (
        <Tooltip
          key={index}
          content={action.tooltip}
          theme={customTheme.tooltip}
        >
          <Button
            onClick={action.onClick}
            color="ghost"
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <action.icon className="text-lg text-gray-500 dark:text-gray-400" />
          </Button>
        </Tooltip>
      ))}
    </div>
  )
}
