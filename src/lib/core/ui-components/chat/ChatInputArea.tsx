import { Button, Textarea } from 'flowbite-react'
import React from 'react'
import { IoSend } from 'react-icons/io5'
import { customTheme } from '../../theme'
import { DeepResearchToggle } from './DeepResearchToggle'

interface ChatInputAreaProps {
  input: string
  loading: boolean
  dots: string
  forceDeepResearch: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement>
  placeholder?: string
  deepResearchTooltip?: string
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSendMessage: () => void
  onToggleDeepResearch: (enabled: boolean) => void
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  input,
  loading,
  dots,
  forceDeepResearch,
  textareaRef,
  placeholder = 'Type your message...',
  deepResearchTooltip,
  onInputChange,
  onKeyDown,
  onSendMessage,
  onToggleDeepResearch,
}) => {
  return (
    <div className="border-t border-gray-200 p-4 dark:border-gray-700">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <DeepResearchToggle
            isEnabled={forceDeepResearch}
            onToggle={onToggleDeepResearch}
            tooltipContent={deepResearchTooltip}
          />

          <Textarea
            theme={customTheme.textarea}
            ref={textareaRef}
            className="focus:border-secondary-500 focus:ring-secondary-500 min-h-[52px] w-full resize-none rounded-lg border-gray-200 bg-white pl-10 text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-zinc-800 dark:text-gray-100 dark:placeholder:text-gray-400"
            value={
              loading
                ? `${forceDeepResearch ? 'Deep research' : 'Thinking'}${dots}`
                : input
            }
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            disabled={loading}
            placeholder={placeholder}
            rows={2}
          />
        </div>
        <Button
          theme={customTheme.button}
          size="sm"
          color="secondary"
          className="h-10 w-10 p-0"
          onClick={onSendMessage}
          disabled={loading}
          aria-label="Send"
        >
          <IoSend className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
