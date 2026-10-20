'use client'

import type { FC } from 'react'
import { HiOutlineLightningBolt } from 'react-icons/hi'

interface EventChipProps {
  eventType: string | null | undefined
  onOpen: () => void
}

/** "from invoice issued": the event a posting came from, opening that event. */
const EventChip: FC<EventChipProps> = ({ eventType, onOpen }) => (
  <button
    type="button"
    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs whitespace-nowrap text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
    title="Open the event this entry came from"
    onClick={(e) => {
      e.stopPropagation()
      onOpen()
    }}
  >
    <HiOutlineLightningBolt className="h-3 w-3" />
    from {eventType ? eventType.replace(/_/g, ' ') : 'event'}
  </button>
)

export default EventChip
