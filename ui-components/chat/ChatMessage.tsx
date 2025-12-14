import { Card, Progress } from 'flowbite-react'
import React from 'react'
import { FaClock, FaSpinner } from 'react-icons/fa'
import ReactMarkdown from 'react-markdown'
import { customTheme } from '../../theme'
import type { Message } from './types'

interface ChatMessageProps {
  message: Message
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => (
  <div
    className={`flex ${
      message.user === 'You' ? 'justify-end' : 'justify-start'
    }`}
  >
    <Card
      theme={customTheme.card}
      className={`max-w-[80%] ${
        message.user === 'You'
          ? 'bg-secondary-500 dark:bg-secondary-600 text-white'
          : 'bg-gray-50 text-gray-900 dark:bg-zinc-700 dark:text-gray-100'
      }`}
    >
      <div className="mb-0.5 flex items-center justify-between text-sm font-semibold opacity-75">
        <span>{message.user}</span>
        {message.isPartial && (
          <div className="flex items-center gap-1">
            <FaSpinner className="h-3 w-3 animate-spin" />
            <span className="text-xs">Analyzing...</span>
          </div>
        )}
        {message.taskId && !message.isPartial && (
          <div className="flex items-center gap-1">
            <FaClock className="h-3 w-3" />
            <span className="text-xs">Deep research</span>
          </div>
        )}
      </div>

      <ReactMarkdown
        components={{
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            return match ? (
              <pre className={className} {...props}>
                {children}
              </pre>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
        }}
      >
        {message.text}
      </ReactMarkdown>

      {/* Progress indicator for partial messages */}
      {message.isPartial && typeof message.progress === 'number' && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span>{message.currentStep || 'Processing...'}</span>
            <span>{message.progress}%</span>
          </div>
          <Progress
            progress={message.progress}
            size="sm"
            color="secondary"
            className="w-full"
            aria-label={`Task progress: ${message.progress}%`}
          />
        </div>
      )}
    </Card>
  </div>
)
