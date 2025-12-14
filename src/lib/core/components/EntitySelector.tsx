'use client'

import { Dropdown, DropdownItem, Spinner } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import React, { useCallback, useState } from 'react'
import { HiChevronDown } from 'react-icons/hi'
import { useApiError, useToast } from '../hooks'

// Generic interfaces for different entity types
export interface SelectableEntity {
  id: string
  name: string
  subtitle?: string
  icon?: React.ComponentType<{ className?: string }>
  metadata?: Record<string, any>
}

export interface EntityGroup {
  id: string
  name: string
  entities: SelectableEntity[]
}

export interface EntitySelectorProps<T extends SelectableEntity> {
  // Core props
  entities: T[]
  currentEntity?: T | null
  onEntityChange: (entity: T) => Promise<void>

  // Display props
  title: string
  placeholder?: string
  emptyStateMessage?: string
  emptyStateAction?: {
    label: string
    href: string
  }

  // Filtering and grouping
  filter?: (entity: T) => boolean
  groupBy?: (entities: T[]) => EntityGroup[]

  // Loading states
  isLoading?: boolean
  isChanging?: boolean

  // Styling
  className?: string
  triggerClassName?: string

  // Icons
  defaultIcon?: React.ComponentType<{ className?: string }>

  // Additional actions
  additionalActions?: Array<{
    label: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
  }>
}

export function EntitySelector<T extends SelectableEntity>({
  entities,
  currentEntity,
  onEntityChange,
  title,
  placeholder = 'Select item',
  emptyStateMessage = 'No items available',
  emptyStateAction,
  filter,
  groupBy,
  isLoading = false,
  isChanging = false,
  className = '',
  triggerClassName = '',
  defaultIcon: DefaultIcon,
  additionalActions = [],
}: EntitySelectorProps<T>) {
  const router = useRouter()
  const { handleApiError } = useApiError()
  const { showSuccess } = useToast()
  const [switching, setSwitching] = useState(false)

  // Filter entities if filter function is provided
  const filteredEntities = filter ? entities.filter(filter) : entities

  // Group entities if groupBy function is provided
  const entityGroups = groupBy ? groupBy(filteredEntities) : null

  const handleEntityChange = useCallback(
    async (entity: T) => {
      if (entity.id === currentEntity?.id || switching) return

      try {
        setSwitching(true)
        await onEntityChange(entity)
        showSuccess(`Switched to ${entity.name}`)
        router.refresh()
      } catch (error) {
        handleApiError(error, `Failed to switch to ${entity.name}`)
      } finally {
        setSwitching(false)
      }
    },
    [
      currentEntity,
      switching,
      onEntityChange,
      showSuccess,
      router,
      handleApiError,
    ]
  )

  const isLoadingState = isLoading || isChanging || switching

  if (isLoadingState && !currentEntity && filteredEntities.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-zinc-800">
        <Spinner size="sm" />
        <span className="text-sm text-gray-500">
          Loading {title.toLowerCase()}...
        </span>
      </div>
    )
  }

  // Empty state
  if (!currentEntity && filteredEntities.length === 0) {
    const EmptyIcon = emptyStateAction ? 'a' : 'div'
    const emptyProps = emptyStateAction ? { href: emptyStateAction.href } : {}

    return (
      <EmptyIcon
        {...emptyProps}
        className={`flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-gray-700 ${emptyStateAction ? 'cursor-pointer' : ''}`}
      >
        {DefaultIcon && <DefaultIcon className="h-4 w-4" />}
        <span>{emptyStateAction?.label || emptyStateMessage}</span>
      </EmptyIcon>
    )
  }

  const displayEntity = currentEntity || filteredEntities[0]
  const EntityIcon = displayEntity?.icon || DefaultIcon

  return (
    <div className={className}>
      <Dropdown
        label=""
        renderTrigger={() => (
          <button
            className={`flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 ${triggerClassName}`}
            disabled={isLoadingState}
          >
            {EntityIcon && <EntityIcon className="h-4 w-4" />}
            <span className="max-w-[150px] truncate">
              {displayEntity?.name || placeholder}
            </span>
            {isLoadingState ? (
              <Spinner size="sm" />
            ) : (
              <HiChevronDown className={`h-4 w-4 transition-transform`} />
            )}
          </button>
        )}
      >
        {/* Entities */}
        {filteredEntities.length === 0 ? (
          <>
            {emptyStateAction && (
              <DropdownItem href={emptyStateAction.href}>
                <div className="flex items-center gap-2">
                  {DefaultIcon && <DefaultIcon className="h-4 w-4" />}
                  <span>{emptyStateAction.label}</span>
                </div>
              </DropdownItem>
            )}
          </>
        ) : (
          <>
            {entityGroups
              ? // Grouped entities
                entityGroups.map((group, groupIndex) => (
                  <div key={group.id}>
                    {groupIndex > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-600" />
                    )}
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                      {group.name}
                    </div>
                    {group.entities.map((entity) => (
                      <EntityDropdownItem
                        key={entity.id}
                        entity={entity}
                        currentEntity={currentEntity}
                        onEntityChange={handleEntityChange}
                        isDisabled={isLoadingState}
                      />
                    ))}
                  </div>
                ))
              : // Ungrouped entities
                filteredEntities.map((entity) => (
                  <EntityDropdownItem
                    key={entity.id}
                    entity={entity}
                    currentEntity={currentEntity}
                    onEntityChange={handleEntityChange}
                    isDisabled={isLoadingState}
                  />
                ))}

            {/* Additional actions */}
            {additionalActions.length > 0 && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-600" />
                {additionalActions.map((action, index) => (
                  <DropdownItem key={index} href={action.href}>
                    <div className="flex items-center gap-2">
                      {action.icon && <action.icon className="h-4 w-4" />}
                      <span>{action.label}</span>
                    </div>
                  </DropdownItem>
                ))}
              </>
            )}
          </>
        )}
      </Dropdown>
    </div>
  )
}

// Helper component for individual entity items
interface EntityDropdownItemProps<T extends SelectableEntity> {
  entity: T
  currentEntity?: T | null
  onEntityChange: (entity: T) => Promise<void>
  isDisabled: boolean
}

function EntityDropdownItem<T extends SelectableEntity>({
  entity,
  currentEntity,
  onEntityChange,
  isDisabled,
}: EntityDropdownItemProps<T>) {
  const EntityIcon = entity.icon
  const isSelected = currentEntity?.id === entity.id
  const isRepository = entity.metadata?.isRepository || false

  return (
    <DropdownItem
      onClick={() => onEntityChange(entity)}
      disabled={isDisabled}
      className={`text-left ${isSelected ? 'bg-gray-700/50' : ''}`}
    >
      <div className="flex w-full items-center gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            isRepository ? 'bg-purple-600/20' : 'bg-blue-600/20'
          }`}
        >
          {EntityIcon && (
            <EntityIcon
              className={`h-4 w-4 ${
                isRepository ? 'text-purple-400' : 'text-blue-400'
              }`}
            />
          )}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div
            className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white'}`}
          >
            {entity.name}
          </div>
          <div className="truncate text-xs text-gray-400">
            {entity.id.slice(0, 10)}
          </div>
        </div>
      </div>
    </DropdownItem>
  )
}
