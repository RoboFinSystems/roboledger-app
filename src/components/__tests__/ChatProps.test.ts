import { describe, expect, it, vi } from 'vitest'
import type { AgentType, ChatInterfaceProps, Message } from '../ChatInterface'

describe('Chat Props and Types', () => {
  describe('Message Interface', () => {
    it('should accept valid message with required fields', () => {
      const message: Message = {
        id: 'test-id',
        text: 'Hello world',
        user: 'You',
      }

      expect(message.id).toBe('test-id')
      expect(message.text).toBe('Hello world')
      expect(message.user).toBe('You')
    })

    it('should accept message with agent user type', () => {
      const message: Message = {
        id: 'test-id',
        text: 'Hello from agent',
        user: 'Agent',
      }

      expect(message.user).toBe('Agent')
    })

    it('should accept message with optional fields', () => {
      const message: Message = {
        id: 'test-id',
        text: 'Processing...',
        user: 'Agent',
        isPartial: true,
        taskId: 'task-123',
        progress: 50,
        currentStep: 'Analyzing data',
      }

      expect(message.isPartial).toBe(true)
      expect(message.taskId).toBe('task-123')
      expect(message.progress).toBe(50)
      expect(message.currentStep).toBe('Analyzing data')
    })

    it('should accept message without optional fields', () => {
      const message: Message = {
        id: 'test-id',
        text: 'Complete message',
        user: 'Agent',
      }

      expect(message.isPartial).toBeUndefined()
      expect(message.taskId).toBeUndefined()
      expect(message.progress).toBeUndefined()
      expect(message.currentStep).toBeUndefined()
    })
  })

  describe('AgentType', () => {
    it('should accept default agent type', () => {
      const agentType: AgentType = 'default'
      expect(agentType).toBe('default')
    })

    it('should only allow valid agent types', () => {
      // This test ensures TypeScript compilation catches invalid types
      const validTypes: AgentType[] = ['default']
      expect(validTypes).toHaveLength(1)
      expect(validTypes[0]).toBe('default')
    })
  })

  describe('ChatInterfaceProps', () => {
    const mockSetMessages = vi.fn()

    it('should accept props with required fields', () => {
      const props: ChatInterfaceProps = {
        messages: [],
        setMessages: mockSetMessages,
      }

      expect(props.messages).toEqual([])
      expect(props.setMessages).toBe(mockSetMessages)
    })

    it('should accept props with optional className', () => {
      const props: ChatInterfaceProps = {
        messages: [],
        setMessages: mockSetMessages,
        className: 'custom-class',
      }

      expect(props.className).toBe('custom-class')
    })

    it('should accept props with optional title', () => {
      const props: ChatInterfaceProps = {
        messages: [],
        setMessages: mockSetMessages,
        title: 'Custom Chat Title',
      }

      expect(props.title).toBe('Custom Chat Title')
    })

    it('should accept props with optional showHeader', () => {
      const props: ChatInterfaceProps = {
        messages: [],
        setMessages: mockSetMessages,
        showHeader: false,
      }

      expect(props.showHeader).toBe(false)
    })

    it('should accept props with all optional fields', () => {
      const props: ChatInterfaceProps = {
        messages: [
          {
            id: 'msg-1',
            text: 'Test message',
            user: 'You',
          },
        ],
        setMessages: mockSetMessages,
        className: 'custom-class',
        title: 'Custom Title',
        showHeader: true,
      }

      expect(props.messages).toHaveLength(1)
      expect(props.className).toBe('custom-class')
      expect(props.title).toBe('Custom Title')
      expect(props.showHeader).toBe(true)
    })

    it('should work with complex message array', () => {
      const messages: Message[] = [
        {
          id: 'msg-1',
          text: 'User question',
          user: 'You',
        },
        {
          id: 'msg-2',
          text: 'Agent response',
          user: 'Agent',
        },
        {
          id: 'msg-3',
          text: 'Processing analysis...',
          user: 'Agent',
          isPartial: true,
          taskId: 'task-456',
          progress: 25,
          currentStep: 'Gathering data',
        },
      ]

      const props: ChatInterfaceProps = {
        messages,
        setMessages: mockSetMessages,
      }

      expect(props.messages).toHaveLength(3)
      expect(props.messages[0].user).toBe('You')
      expect(props.messages[1].user).toBe('Agent')
      expect(props.messages[2].isPartial).toBe(true)
    })
  })

  describe('Message ID Generation', () => {
    it('should generate unique message IDs', () => {
      const ids = new Set<string>()

      // Generate multiple IDs and check uniqueness
      for (let i = 0; i < 100; i++) {
        const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        expect(ids.has(id)).toBe(false)
        ids.add(id)
      }

      expect(ids.size).toBe(100)
    })

    it('should generate IDs with correct format', () => {
      const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      expect(id).toMatch(/^msg_\d+_[a-z0-9]+$/)
      expect(id.startsWith('msg_')).toBe(true)
    })
  })

  describe('Message User Types', () => {
    it('should only accept valid user types', () => {
      const userMessage: Message = {
        id: 'test-1',
        text: 'User message',
        user: 'You',
      }

      const agentMessage: Message = {
        id: 'test-2',
        text: 'Agent message',
        user: 'Agent',
      }

      expect(userMessage.user).toBe('You')
      expect(agentMessage.user).toBe('Agent')
    })
  })

  describe('Message Progress Values', () => {
    it('should accept valid progress values', () => {
      const progressValues = [0, 25, 50, 75, 100]

      progressValues.forEach((progress) => {
        const message: Message = {
          id: `msg-${progress}`,
          text: 'Processing...',
          user: 'Agent',
          isPartial: true,
          progress,
        }

        expect(message.progress).toBe(progress)
      })
    })

    it('should handle undefined progress', () => {
      const message: Message = {
        id: 'test-id',
        text: 'Complete',
        user: 'Agent',
        progress: undefined,
      }

      expect(message.progress).toBeUndefined()
    })
  })

  describe('Message Validation Scenarios', () => {
    it('should handle partial messages correctly', () => {
      const partialMessage: Message = {
        id: 'partial-1',
        text: 'Starting analysis...',
        user: 'Agent',
        isPartial: true,
        progress: 0,
        currentStep: 'Initializing',
      }

      expect(partialMessage.isPartial).toBe(true)
      expect(partialMessage.progress).toBe(0)
      expect(partialMessage.currentStep).toBe('Initializing')
    })

    it('should handle completed task messages correctly', () => {
      const completedMessage: Message = {
        id: 'completed-1',
        text: 'Analysis complete!',
        user: 'Agent',
        taskId: 'task-789',
        isPartial: false,
        progress: 100,
        currentStep: 'Complete',
      }

      expect(completedMessage.isPartial).toBe(false)
      expect(completedMessage.progress).toBe(100)
      expect(completedMessage.currentStep).toBe('Complete')
      expect(completedMessage.taskId).toBe('task-789')
    })

    it('should handle simple messages correctly', () => {
      const simpleMessage: Message = {
        id: 'simple-1',
        text: 'Hello, how can I help you?',
        user: 'Agent',
      }

      expect(simpleMessage.isPartial).toBeUndefined()
      expect(simpleMessage.taskId).toBeUndefined()
      expect(simpleMessage.progress).toBeUndefined()
      expect(simpleMessage.currentStep).toBeUndefined()
    })
  })

  describe('SetMessages Function Type', () => {
    it('should accept function that updates messages with new array', () => {
      const setMessages: React.Dispatch<React.SetStateAction<Message[]>> =
        vi.fn()
      const newMessages: Message[] = [
        { id: 'new-1', text: 'New message', user: 'You' },
      ]

      setMessages(newMessages)
      expect(setMessages).toHaveBeenCalledWith(newMessages)
    })

    it('should accept function that updates messages with callback', () => {
      const setMessages: React.Dispatch<React.SetStateAction<Message[]>> =
        vi.fn()
      const updateCallback = (prev: Message[]): Message[] => [
        ...prev,
        { id: 'new-2', text: 'Another message', user: 'Agent' as const },
      ]

      setMessages(updateCallback)
      expect(setMessages).toHaveBeenCalledWith(updateCallback)
    })
  })

  describe('Component Props Edge Cases', () => {
    const mockSetMessages = vi.fn()

    it('should handle empty messages array', () => {
      const props: ChatInterfaceProps = {
        messages: [],
        setMessages: mockSetMessages,
      }

      expect(props.messages).toEqual([])
      expect(Array.isArray(props.messages)).toBe(true)
    })

    it('should handle empty string values', () => {
      const props: ChatInterfaceProps = {
        messages: [],
        setMessages: mockSetMessages,
        className: '',
        title: '',
      }

      expect(props.className).toBe('')
      expect(props.title).toBe('')
    })

    it('should handle boolean showHeader values', () => {
      const propsTrue: ChatInterfaceProps = {
        messages: [],
        setMessages: mockSetMessages,
        showHeader: true,
      }

      const propsFalse: ChatInterfaceProps = {
        messages: [],
        setMessages: mockSetMessages,
        showHeader: false,
      }

      expect(propsTrue.showHeader).toBe(true)
      expect(propsFalse.showHeader).toBe(false)
    })
  })
})
