'use client'

import { customTheme } from '@/lib/core'
import { Button } from 'flowbite-react'
import type { FC } from 'react'
import { HiEye, HiTable } from 'react-icons/hi'

export type ViewMode = 'rendered' | 'facts'

interface ViewModeToggleProps {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}

const ViewModeToggle: FC<ViewModeToggleProps> = ({ viewMode, onChange }) => {
  return (
    <div className="flex">
      <Button
        theme={customTheme.button}
        size="xs"
        color={viewMode === 'rendered' ? 'primary' : 'light'}
        onClick={() => onChange('rendered')}
        className="rounded-r-none"
      >
        <HiEye className="mr-1.5 h-3.5 w-3.5" />
        Rendered
      </Button>
      <Button
        theme={customTheme.button}
        size="xs"
        color={viewMode === 'facts' ? 'primary' : 'light'}
        onClick={() => onChange('facts')}
        className="rounded-l-none"
      >
        <HiTable className="mr-1.5 h-3.5 w-3.5" />
        Facts
      </Button>
    </div>
  )
}

export default ViewModeToggle
