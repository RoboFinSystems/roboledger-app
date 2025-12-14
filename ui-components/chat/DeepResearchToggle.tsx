import { Tooltip } from 'flowbite-react'
import React from 'react'
import { FaLightbulb } from 'react-icons/fa'

interface DeepResearchToggleProps {
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
  tooltipContent?: string
}

export const DeepResearchToggle: React.FC<DeepResearchToggleProps> = ({
  isEnabled,
  onToggle,
  tooltipContent = 'Deep Research: Enables comprehensive analysis with up to 12 tool calls',
}) => {
  return (
    <div className="absolute top-3 left-3 z-10">
      <Tooltip content={tooltipContent} placement="top">
        <div
          className={`cursor-pointer transition-all duration-200 ${
            isEnabled
              ? 'text-yellow-500 hover:text-yellow-400'
              : 'text-gray-400 hover:text-yellow-400 dark:text-gray-500 dark:hover:text-yellow-400'
          }`}
          onClick={() => onToggle(!isEnabled)}
          role="button"
          aria-label="Toggle Deep Research Mode"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onToggle(!isEnabled)
            }
          }}
        >
          <FaLightbulb className="h-4 w-4" />
        </div>
      </Tooltip>
    </div>
  )
}
