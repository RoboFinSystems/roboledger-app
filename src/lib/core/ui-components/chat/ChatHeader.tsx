import React from 'react'
import { FaRobot } from 'react-icons/fa'
import type { AgentType } from './types'

interface ChatHeaderProps {
  agentType: AgentType
  setAgentType: React.Dispatch<React.SetStateAction<AgentType>>
  loading: boolean
  title?: string
  activeTasks?: number
  agentDescription?: string
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  agentType,
  setAgentType,
  loading,
  title = 'AI Chat',
  activeTasks = 0,
  agentDescription = 'Financial Analysis Agent',
}) => {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <FaRobot className="text-secondary-500 dark:text-secondary-400 h-5 w-5" />
        <h5 className="font-heading text-lg font-medium text-gray-900 dark:text-gray-100">
          {title}
        </h5>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {agentDescription}
          </span>
        </div>
      </div>
    </div>
  )
}
