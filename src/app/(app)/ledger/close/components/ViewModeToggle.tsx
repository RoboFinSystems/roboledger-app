'use client'

import { Dropdown, DropdownItem } from 'flowbite-react'
import type { FC } from 'react'
import {
  HiBookOpen,
  HiChevronDown,
  HiClipboardList,
  HiEye,
  HiShieldCheck,
  HiTable,
} from 'react-icons/hi'

/**
 * The six `type-of View` arms in Charlie's Seattle Method ontology
 * (financial-viewer.md §4.3). Five ship today (`rendered`, `facts`,
 * `elements`, `validation`, `rules`); the remaining one
 * (`associations` / Model Structure) lands when the depth-spec design
 * decision settles.
 */
export type ViewMode =
  | 'rendered'
  | 'facts'
  | 'elements'
  | 'validation'
  | 'rules'

interface ViewModeToggleProps {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}

type ModeOption = {
  value: ViewMode
  label: string
  icon: typeof HiEye
}

const MODES: readonly ModeOption[] = [
  { value: 'rendered', label: 'Rendered', icon: HiEye },
  { value: 'facts', label: 'Facts', icon: HiTable },
  { value: 'elements', label: 'Elements', icon: HiClipboardList },
  { value: 'validation', label: 'Validation', icon: HiShieldCheck },
  { value: 'rules', label: 'Rules', icon: HiBookOpen },
] as const

/**
 * Dropdown picker over the View projections. Was a segmented two-button
 * toggle while only `rendered` and `facts` shipped; switched to a
 * dropdown in §7.6 to absorb the remaining four projections (Model
 * Structure / Verification Results / Report Elements / Business Rules)
 * without UI churn each time one lands.
 *
 * Flowbite's `Dropdown` synthesizes its own trigger button when `label`
 * is a string, so we pass a string label and let the component manage
 * focus/aria. Wrapping the label in a custom `Button as="span"` looked
 * cleaner but blocked Flowbite's pointer handler chain — item clicks
 * silently no-op'd. Lesson: trust the library's trigger.
 */
const ViewModeToggle: FC<ViewModeToggleProps> = ({ viewMode, onChange }) => {
  const current = MODES.find((m) => m.value === viewMode) ?? MODES[0]
  const CurrentIcon = current.icon
  return (
    <Dropdown
      size="xs"
      color="light"
      arrowIcon={false}
      aria-label={`View mode: ${current.label}`}
      label={
        <span className="inline-flex items-center">
          <CurrentIcon className="mr-1.5 h-3.5 w-3.5" />
          {current.label}
          <HiChevronDown className="ml-1.5 h-3.5 w-3.5" />
        </span>
      }
    >
      {MODES.map((mode) => {
        const Icon = mode.icon
        const active = mode.value === viewMode
        return (
          <DropdownItem
            key={mode.value}
            onClick={() => onChange(mode.value)}
            icon={Icon}
            className={active ? 'font-semibold text-blue-600' : ''}
          >
            {mode.label}
          </DropdownItem>
        )
      })}
    </Dropdown>
  )
}

export default ViewModeToggle
