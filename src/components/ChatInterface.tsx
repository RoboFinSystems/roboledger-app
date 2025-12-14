import {
  ChatHeader,
  ChatInputArea,
  ChatMessage,
  ErrorType,
  SDK,
  categorizeError,
  customTheme,
  generateMessageId,
  getErrorMessage,
  useGraphContext,
  type AgentType,
  type Message,
} from '@/lib/core'
import { Card } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { FaRobot } from 'react-icons/fa'

// Re-export types from core lib for external consumption
export type { AgentType, Message } from '@/lib/core'

// RoboLedger-specific types
interface AgentOption {
  id: AgentType
  name: string
  description: string
  recommended?: boolean
}

export interface ChatInterfaceProps {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  className?: string
  title?: string
  showHeader?: boolean
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  setMessages,
  className = '',
  title,
  showHeader = true,
}) => {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dots, setDots] = useState('')
  const [agentType, setAgentType] = useState<AgentType>('default') // Default to financial agent
  const [activeTasks, setActiveTasks] = useState<Set<string>>(new Set())
  const [forceDeepResearch, setForceDeepResearch] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pollIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const cleanedUpTasks = useRef<Set<string>>(new Set())
  const ariaLiveRef = useRef<HTMLDivElement>(null)
  const sendMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const {
    state: { currentGraphId },
  } = useGraphContext()

  // Cleanup active task polling on unmount
  useEffect(() => {
    const intervals = pollIntervals.current
    const cleanedUp = cleanedUpTasks.current
    const sendMessageTimeout = sendMessageTimeoutRef.current
    return () => {
      // Clear all active polling intervals when component unmounts
      intervals.forEach((interval) => {
        clearInterval(interval)
      })
      intervals.clear()
      cleanedUp.clear()
      setActiveTasks(new Set())

      // Clear debounce timeout
      if (sendMessageTimeout) {
        clearTimeout(sendMessageTimeout)
      }
    }
  }, [])

  // Cleanup on navigation away from chat
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Cleanup all active tasks before page unload
      pollIntervals.current.forEach((interval) => {
        clearInterval(interval)
      })
      pollIntervals.current.clear()
      cleanedUpTasks.current.clear()
      setActiveTasks(new Set())
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      handleBeforeUnload() // Cleanup on component unmount too
    }
  }, [])

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setDots((d) => (d.length >= 3 ? '' : d + '.'))
      }, 500)
      return () => clearInterval(interval)
    }
    setDots('')
  }, [loading])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()

    // Announce new messages to screen readers
    if (messages.length > 0 && ariaLiveRef.current) {
      const lastMessage = messages[messages.length - 1]
      const announcement = `${lastMessage.user}: ${lastMessage.text.substring(0, 100)}${lastMessage.text.length > 100 ? '...' : ''}`
      ariaLiveRef.current.textContent = announcement

      // Clear after announcement to avoid repetition
      setTimeout(() => {
        if (ariaLiveRef.current) {
          ariaLiveRef.current.textContent = ''
        }
      }, 1000)
    }
  }, [messages])

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  useEffect(() => {
    if (!loading && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [loading])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  // Helper function to clean up a task
  const cleanupTask = (taskId: string) => {
    // Mark task as cleaned up
    cleanedUpTasks.current.add(taskId)

    const interval = pollIntervals.current.get(taskId)
    if (interval) {
      clearInterval(interval)
      pollIntervals.current.delete(taskId)
    }
    setActiveTasks((prev) => {
      const newSet = new Set(prev)
      newSet.delete(taskId)
      return newSet
    })
  }

  // Poll task status and update message
  const pollTaskStatus = async (taskId: string, messageId: string) => {
    if (!currentGraphId) return

    // Add task to active tasks immediately
    setActiveTasks((prev) => new Set([...prev, taskId]))

    const pollInterval = setInterval(async () => {
      // Check if task has already been cleaned up - use centralized cleanup
      if (cleanedUpTasks.current.has(taskId)) {
        cleanupTask(taskId)
        return
      }

      try {
        const response = await SDK.getOperationStatus({
          path: {
            operation_id: taskId,
          },
        })

        if (!response.data) return

        const status = response.data

        setMessages((prev) => {
          const updated = [...prev]
          const messageIndex = updated.findIndex((msg) => msg.id === messageId)

          if (messageIndex !== -1) {
            const message = updated[messageIndex]

            if (message.taskId === taskId) {
              if (status.status === 'in_progress') {
                // Update progress only - don't change the message text during progress
                updated[messageIndex] = {
                  ...message,
                  progress: (status as any).progress || undefined,
                  currentStep: (status as any).step || undefined,
                }
              } else if (status.status === 'completed' && status.result) {
                // Task completed successfully
                const result = status.result as { response?: string }
                updated[messageIndex] = {
                  ...message,
                  text: result.response || (status as any).message,
                  isPartial: false,
                  progress: 100,
                  currentStep: 'Complete',
                }
                // Clean up immediately to prevent further polling
                cleanupTask(taskId)
              } else if (status.status === 'failed') {
                // Task failed
                updated[messageIndex] = {
                  ...message,
                  text:
                    message.text +
                    '\n\n❌ Extended analysis failed: ' +
                    (status.error || 'Unknown error'),
                  isPartial: false,
                  progress: undefined,
                  currentStep: undefined,
                }
                // Clean up immediately to prevent further polling
                cleanupTask(taskId)
              }
            }
          }

          return updated
        })
      } catch (error) {
        console.error('Error polling task status:', error)
        cleanupTask(taskId)
      }
    }, 2000) // Poll every 2 seconds

    // Store the interval for cleanup
    pollIntervals.current.set(taskId, pollInterval)

    // Cleanup after 10 minutes max
    setTimeout(
      () => {
        cleanupTask(taskId)
      },
      10 * 60 * 1000
    ) // 10 minutes
  }

  const sendMessage = async () => {
    const trimmedInput = input.trim()
    if (trimmedInput === '') return

    // Check if graph is selected
    if (!currentGraphId) {
      const errorMessage: Message = {
        id: generateMessageId(),
        text: 'Please select a graph first to access your financial data.',
        user: 'Agent',
      }
      setMessages((prev) => [...prev, errorMessage])
      return
    }

    const newMessage: Message = {
      id: generateMessageId(),
      text: trimmedInput,
      user: 'You',
    }
    setMessages((prev) => [...prev, newMessage])
    setInput('')

    try {
      setLoading(true)

      // Format conversation history for the agent
      const history = messages.map((msg) => ({
        role: msg.user === 'You' ? 'user' : 'assistant',
        content: msg.text,
      }))

      const agentRequest = {
        path: { graph_id: currentGraphId },
        body: {
          message: trimmedInput,
          history,
          force_extended_analysis: forceDeepResearch,
        },
      }

      // TODO: Implement the new AI agent integration
      // The AI agent was substantially rewritten and needs proper frontend implementation

      const agentMessageId = generateMessageId()
      const agentMessage: Message = {
        id: agentMessageId,
        text: "I'm sorry, the AI agent is currently being updated with new capabilities. Please check back soon for enhanced financial analysis features.",
        user: 'Agent',
        isPartial: false,
      }

      setMessages((prev) => [...prev, agentMessage])
    } catch (error) {
      console.error('Error querying financial agent:', error)

      // Categorize and get appropriate error message
      const errorType =
        error instanceof Error ? categorizeError(error) : ErrorType.UNKNOWN
      const errorText = getErrorMessage(errorType)

      const errorMessage: Message = {
        id: generateMessageId(),
        text: errorText,
        user: 'Agent',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  // Debounced send message to prevent rapid submissions
  const debouncedSendMessage = () => {
    if (sendMessageTimeoutRef.current) {
      clearTimeout(sendMessageTimeoutRef.current)
    }

    sendMessageTimeoutRef.current = setTimeout(() => {
      sendMessage()
    }, 300) // 300ms debounce
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      debouncedSendMessage()
    }
  }

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Screen reader announcements */}
      <div
        ref={ariaLiveRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      {showHeader && (
        <ChatHeader
          agentType={agentType}
          setAgentType={setAgentType}
          loading={loading}
          title={title || 'RoboLedger AI Chat'}
          activeTasks={activeTasks.size}
          agentDescription="Financial Analysis Agent"
        />
      )}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto px-4 pt-4">
            <div className="space-y-4">
              {messages.length === 0 && !currentGraphId && (
                <Card theme={customTheme.card} className="text-center">
                  <FaRobot className="text-secondary-500 dark:text-secondary-400 mx-auto mb-3 h-12 w-12" />
                  <h4 className="font-heading mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                    Welcome to RoboLedger AI
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Please select a graph first to start chatting about your
                    financial data.
                  </p>
                </Card>
              )}
              {messages.length === 0 && currentGraphId && (
                <Card theme={customTheme.card} className="text-center">
                  <FaRobot className="text-secondary-500 dark:text-secondary-400 mx-auto mb-3 h-12 w-12" />
                  <h4 className="font-heading mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                    Welcome to RoboLedger AI
                  </h4>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    I provide comprehensive financial analysis using your
                    company's data. For complex analysis, I'll automatically
                    perform deep research with multiple data sources and provide
                    detailed insights.
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <div className="mb-2 font-medium">
                      Try complex queries like:
                    </div>
                    <div className="space-y-1">
                      <div>
                        "Analyze our cash flow trends over the past 6 months"
                      </div>
                      <div>
                        "Compare our current performance to industry benchmarks"
                      </div>
                      <div>
                        "Generate a comprehensive financial health assessment"
                      </div>
                      <div>
                        "Review our trial balance and identify potential issues"
                      </div>
                    </div>
                    <div className="mt-3 text-xs">
                      💡 Complex queries automatically trigger deep research
                      mode
                    </div>
                  </div>
                </Card>
              )}
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
            <div ref={messagesEndRef} />
          </div>
          <ChatInputArea
            input={input}
            loading={loading}
            dots={dots}
            forceDeepResearch={forceDeepResearch}
            textareaRef={textareaRef}
            placeholder="Type your message..."
            deepResearchTooltip="Deep Research: Enables comprehensive analysis with up to 12 tool calls"
            onInputChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSendMessage={debouncedSendMessage}
            onToggleDeepResearch={setForceDeepResearch}
          />
        </div>
      </div>
    </div>
  )
}
