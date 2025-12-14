import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ChatInterface,
  type ChatInterfaceProps,
  type Message,
} from '../ChatInterface'

// Mock scrollIntoView
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
})

// Mock external dependencies
const mockUseCreditAwareOperation = vi.fn()
const mockUseGraphContext = vi.fn()

vi.mock('@/lib/core', () => ({
  SDK: {
    getTaskStatus: vi.fn(),
    // queryFinancialAgent: vi.fn(), // TODO: Implement new AI agent methods
  },
  useCreditAwareOperation: () => mockUseCreditAwareOperation(),
  useGraphContext: () => mockUseGraphContext(),
  generateMessageId: vi.fn(() => 'msg-123'),
  categorizeError: vi.fn(() => 'UNKNOWN'),
  getErrorMessage: vi.fn(() => 'An error occurred'),
  customTheme: {
    card: {},
  },
  ChatHeader: ({ title }: { title: string }) => <div>{title}</div>,
  ChatInputArea: ({
    input,
    loading,
    onInputChange,
    onKeyDown,
    onSendMessage,
    placeholder,
    textareaRef,
  }: any) => (
    <div>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={onInputChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label="Message input"
      />
      <button onClick={onSendMessage} aria-label="Send" disabled={loading}>
        Send
      </button>
    </div>
  ),
  ChatMessage: ({ message }: { message: Message }) => (
    <div>
      <strong>{message.user}:</strong> {message.text}
    </div>
  ),
}))

// Mock router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}))

// Mock flowbite-react components
vi.mock('flowbite-react', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
}))

// Mock react-icons
vi.mock('react-icons/fa', () => ({
  FaRobot: () => <div data-testid="robot-icon" />,
}))

const { SDK } = (await vi.importMock('@/lib/core')) as {
  SDK: { getTaskStatus: ReturnType<typeof vi.fn> }
}
const getTaskStatus = SDK.getTaskStatus as ReturnType<typeof vi.fn>

describe('ChatInterface', () => {
  const defaultProps: ChatInterfaceProps = {
    messages: [],
    setMessages: vi.fn(),
    className: 'test-class',
    title: 'Test Chat',
    showHeader: true,
  }

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()
    getTaskStatus.mockClear()
    mockUseGraphContext.mockClear()

    // Reset default graph selection mock
    mockUseGraphContext.mockReturnValue({
      state: { currentGraphId: 'graph-456' },
    })

    // Reset executeWithCredits mock
    mockUseCreditAwareOperation.mockReturnValue({
      executeWithCredits: vi.fn().mockImplementation((fn) => fn()),
    })
  })

  describe('Component Rendering', () => {
    it('renders the chat interface', () => {
      render(<ChatInterface {...defaultProps} />)
      expect(screen.getByText('Test Chat')).toBeInTheDocument()
    })

    it('renders without header when showHeader is false', () => {
      render(<ChatInterface {...defaultProps} showHeader={false} />)
      expect(screen.queryByText('Test Chat')).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<ChatInterface {...defaultProps} />)
      expect(container.firstChild).toHaveClass('test-class')
    })

    it('shows welcome message when no graph is selected', () => {
      mockUseGraphContext.mockReturnValue({
        state: { currentGraphId: null },
      })

      render(<ChatInterface {...defaultProps} />)
      expect(
        screen.getByText(/Please select a graph first to start chatting/)
      ).toBeInTheDocument()
    })

    it('shows AI welcome message when graph is selected', () => {
      render(<ChatInterface {...defaultProps} />)
      expect(screen.getByText('Welcome to RoboLedger AI')).toBeInTheDocument()
    })
  })

  describe('Message Display', () => {
    it('displays existing messages', () => {
      const messages: Message[] = [
        { id: 'msg-1', text: 'Hello', user: 'You' },
        { id: 'msg-2', text: 'Hi there!', user: 'Agent' },
      ]

      render(<ChatInterface {...defaultProps} messages={messages} />)

      expect(screen.getByText('You:')).toBeInTheDocument()
      expect(screen.getByText('Hello')).toBeInTheDocument()
      expect(screen.getByText('Agent:')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })

    it('updates when messages prop changes', () => {
      const { rerender } = render(<ChatInterface {...defaultProps} />)

      const newMessages: Message[] = [
        { id: 'msg-1', text: 'New message', user: 'You' },
      ]

      rerender(<ChatInterface {...defaultProps} messages={newMessages} />)
      expect(screen.getByText('New message')).toBeInTheDocument()
    })
  })

  describe('Message Input', () => {
    it('updates input value when typing', async () => {
      render(<ChatInterface {...defaultProps} />)
      const input = screen.getByLabelText('Message input')

      await userEvent.type(input, 'Test message')

      expect(input).toHaveValue('Test message')
    })

    it('clears input after sending message', async () => {
      // Test that input clears when Enter is pressed (even without agent)

      await act(async () => {
        render(<ChatInterface {...defaultProps} />)
      })

      const input = screen.getByLabelText('Message input')

      await userEvent.type(input, 'Test message')
      await userEvent.keyboard('{Enter}')

      // Input should be cleared regardless of agent response
      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    })
  })

  /*
  TODO: Re-enable these tests when the new AI agent is implemented

  describe('Message Sending', () => {
    // Tests for actual message sending functionality
  })

  describe('Company Selection', () => {
    // Tests for company selection validation
  })

  describe('Error Handling', () => {
    // Tests for error handling during agent queries
  })

  describe('Task Polling', () => {
    // Tests for long-running task status polling
  })

  describe('Conversation History', () => {
    // Tests for conversation history handling
  })
  */

  describe('Component Lifecycle', () => {
    it('cleans up on unmount', () => {
      const { unmount } = render(<ChatInterface {...defaultProps} />)
      expect(() => unmount()).not.toThrow()
    })
  })
})
