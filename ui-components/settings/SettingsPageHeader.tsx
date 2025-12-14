import { Breadcrumb, BreadcrumbItem } from 'flowbite-react'
import React from 'react'
import { HiHome } from 'react-icons/hi'

export interface SettingsPageHeaderProps {
  title?: string
  homeHref?: string
  className?: string
}

export const SettingsPageHeader: React.FC<SettingsPageHeaderProps> = ({
  title = 'User settings',
  homeHref = '/home',
  className = '',
}) => {
  return (
    <div className={`col-span-full mb-4 xl:mb-2 ${className}`}>
      <Breadcrumb className="mb-5">
        <BreadcrumbItem href={homeHref}>
          <div className="flex items-center gap-x-3">
            <HiHome className="text-xl" />
            <span className="dark:text-white">Home</span>
          </div>
        </BreadcrumbItem>
        <BreadcrumbItem>Settings</BreadcrumbItem>
      </Breadcrumb>
      <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
        {title}
      </h1>
    </div>
  )
}
