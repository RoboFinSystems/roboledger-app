'use client'

import {
  DarkThemeToggle,
  Dropdown,
  DropdownDivider,
  DropdownHeader,
  DropdownItem,
  Navbar as FlowbiteNavbar,
  NavbarBrand,
  Tooltip,
} from 'flowbite-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import { HiMenuAlt1, HiUserCircle, HiX } from 'react-icons/hi'
import { AppSwitcher } from '../../auth-components'
import { useAuth } from '../../auth-components/AuthProvider'
import { useSidebarContext } from '../../contexts'
import { useMediaQuery, useUser } from '../../hooks'
import { customTheme } from '../../theme'
import type { User } from '../../types'
import { ThemeToggle } from './ThemeToggle'

export interface CoreNavbarProps {
  appName: string
  currentApp: 'roboledger' | 'roboinvestor' | 'robosystems'
  apiUrl?: string
  homeHref?: string
  logoAltText?: string
  additionalComponents?: React.ReactNode
  className?: string
  borderColorClass?: string
  useCustomThemeToggle?: boolean
  showAppSwitcherFirst?: boolean
}

export function CoreNavbar({
  appName,
  currentApp,
  apiUrl = process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL ||
    'http://localhost:8000',
  homeHref = '/home',
  logoAltText,
  additionalComponents,
  className = '',
  borderColorClass = 'dark:border-gray-700',
  useCustomThemeToggle = true,
  showAppSwitcherFirst = false,
}: CoreNavbarProps) {
  const sidebar = useSidebarContext()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { user } = useUser()
  const { logout } = useAuth()
  const router = useRouter()

  const altText = logoAltText || `${appName} Logo`

  function handleToggleSidebar() {
    if (isDesktop) {
      sidebar.desktop.toggle()
    } else {
      sidebar.mobile.toggle()
    }
  }

  const handleLogout = async () => {
    try {
      await logout()

      // Brief delay to ensure backend processing completes
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Redirect to homepage
      window.location.replace('/')
    } catch (error) {
      console.error('Logout failed:', error)
      // Even if logout fails, redirect to home
      window.location.replace('/')
    }
  }

  const renderThemeToggle = () => {
    if (useCustomThemeToggle) {
      return <ThemeToggle />
    }

    return (
      <>
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
      </>
    )
  }

  const renderAppSwitcher = () => (
    <Tooltip content="Switch apps" theme={customTheme.tooltip}>
      <AppSwitcher apiUrl={apiUrl} currentApp={currentApp} />
    </Tooltip>
  )

  return (
    <FlowbiteNavbar
      fluid
      theme={customTheme.navbar}
      className={`fixed top-0 z-30 w-full border-b border-gray-200 p-0 ${borderColorClass} bg-white sm:p-0 dark:bg-black ${className}`}
    >
      <div className="w-full p-3 pr-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={handleToggleSidebar}
              className="mr-3 cursor-pointer rounded-sm p-2 text-gray-600 hover:bg-zinc-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-700 dark:hover:text-white"
            >
              <span className="sr-only">Toggle sidebar</span>
              {/* mobile */}
              <div className="lg:hidden">
                {sidebar.mobile.isOpen ? (
                  <HiX className="h-6 w-6" />
                ) : (
                  <HiMenuAlt1 className="h-6 w-6" />
                )}
              </div>
              {/* desktop */}
              <div className="hidden lg:block">
                <HiMenuAlt1 className="h-6 w-6" />
              </div>
            </button>
            <NavbarBrand as={Link} href={homeHref} className="mr-14">
              <Image
                src="/images/logo_black.png"
                alt={altText}
                width={40}
                height={40}
                className="mr-2 dark:hidden"
              />
              <Image
                src="/images/logo.png"
                alt={altText}
                width={40}
                height={40}
                className="mr-2 hidden dark:block"
              />
              <span className="font-heading mt-2 ml-1 self-center text-2xl font-semibold whitespace-nowrap text-gray-900 dark:text-white">
                {appName}
              </span>
            </NavbarBrand>
          </div>
          <div className="flex items-center lg:gap-3">
            <div className="flex items-center">
              {additionalComponents && (
                <div className="mr-2 hidden md:block">
                  {additionalComponents}
                </div>
              )}
              <div className="flex items-center space-x-2">
                {showAppSwitcherFirst && renderAppSwitcher()}
                {renderThemeToggle()}
                {!showAppSwitcherFirst && renderAppSwitcher()}
                <UserDropdown user={user} onLogout={handleLogout} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </FlowbiteNavbar>
  )
}

interface UserDropdownProps {
  user: User | null
  onLogout: () => void
}

function UserDropdown({ user, onLogout }: UserDropdownProps) {
  return (
    <div className="relative">
      <Dropdown
        theme={{
          ...customTheme.dropdown,
          floating: {
            ...customTheme.dropdown.floating,
            base: `${customTheme.dropdown.floating.base} z-50! w-64`,
          },
        }}
        arrowIcon={false}
        inline
        label={
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm text-gray-500 hover:bg-zinc-100 focus:ring-2 focus:ring-gray-200 focus:outline-hidden dark:text-gray-400 dark:hover:bg-zinc-700 dark:focus:ring-gray-600">
            <span className="sr-only">User menu</span>
            <HiUserCircle className="h-6 w-6" />
          </span>
        }
      >
        <DropdownHeader
          theme={{ header: customTheme.dropdown.floating.header }}
          className="px-4 py-3"
        >
          <div className="block text-sm font-medium text-gray-900 dark:text-white">
            {user?.name || 'User'}
          </div>
          {user?.email && (
            <div className="block truncate text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </div>
          )}
        </DropdownHeader>
        <DropdownItem
          theme={customTheme.dropdown.floating.item}
          as={Link}
          href="/settings"
          className="flex w-full items-center space-x-3 p-3"
        >
          User Settings
        </DropdownItem>
        <DropdownDivider
          theme={{ divider: customTheme.dropdown.floating.divider }}
        />
        <DropdownItem
          theme={customTheme.dropdown.floating.item}
          onClick={() => {
            onLogout()
          }}
          className="flex w-full items-center space-x-3 p-3"
        >
          Sign out
        </DropdownItem>
      </Dropdown>
    </div>
  )
}
