'use client'

import {
  Dropdown,
  DropdownDivider,
  DropdownHeader,
  DropdownItem,
} from 'flowbite-react'
import { Fragment, type FC, type ReactNode } from 'react'
import { HiDownload } from 'react-icons/hi'

export interface ExportMenuItem {
  /** Opaque id handed back to `onSelect`. */
  key: string
  label: ReactNode
  /** Optional second line — what the format is good for. */
  hint?: string
}

export interface ExportMenuGroup {
  /** Small-caps group header; omit for an unlabeled group. */
  header?: string
  items: ExportMenuItem[]
}

interface ExportMenuProps {
  groups: ExportMenuGroup[]
  onSelect: (key: string) => void
  disabled?: boolean
  /** Button text — "Export" unless a surface wants something narrower. */
  label?: string
}

/**
 * The serialization menu shared by the grid surfaces (Plan, Block
 * Explorer) — the same shape the Report viewer uses for its bundle
 * formats, generalized: one button that opens a list of serializations
 * instead of one button per format. Groups exist so a surface can scope
 * the same formats two ways (Plan's current view vs. full range)
 * without inventing a second control.
 */
const ExportMenu: FC<ExportMenuProps> = ({
  groups,
  onSelect,
  disabled = false,
  label = 'Export',
}) => (
  <Dropdown
    size="xs"
    color="light"
    disabled={disabled}
    data-testid="export-menu"
    label={
      <span className="flex items-center">
        <HiDownload className="mr-1.5 h-3.5 w-3.5" />
        {label}
      </span>
    }
  >
    {groups.map((group, index) => (
      <Fragment key={group.header ?? `group-${index}`}>
        {index > 0 && <DropdownDivider />}
        {group.header && <DropdownHeader>{group.header}</DropdownHeader>}
        {group.items.map((item) => (
          <DropdownItem key={item.key} onClick={() => onSelect(item.key)}>
            <span className="flex flex-col items-start">
              <span>{item.label}</span>
              {item.hint && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.hint}
                </span>
              )}
            </span>
          </DropdownItem>
        ))}
      </Fragment>
    ))}
  </Dropdown>
)

export default ExportMenu
