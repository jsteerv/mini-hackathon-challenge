import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArchonChatPanel } from '@/components/layouts/ArchonChatPanel'
import { agentChatService, ChatMessage } from '@/services/agentChatService'

// Mock dependencies
vi.mock('@/services/agentChatService')

const mockAgentChatService = {
  createSession: vi.fn(),
  getSession: vi.fn(),
  sendMessage: vi.fn(),
  connectWebSocket: vi.fn(),
  disconnectWebSocket: vi.fn(),
  isConnected: vi.fn(),
  onStatusChange: vi.fn(),
  offStatusChange: vi.fn(),
  manualReconnect: vi.fn(),
}

describe('ArchonChatPanel - RAG Features', () => {
  const mockSessionId = 'test-session-123'
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      content: 'Hello, how can I help you with your queries?',
      sender: 'agent',
      timestamp: new Date(),
      agent_type: 'rag',
      metadata: {}
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock environment variables
    import.meta.env.VITE_ENABLE_WEBSOCKET = 'true'
    
    // Setup default mock responses
    mockAgentChatService.createSession.mockResolvedValue({ session_id: mockSessionId })
    mockAgentChatService.getSession.mockResolvedValue({
      session_id: mockSessionId,
      messages: mockMessages,
      agent_type: 'rag',
      created_at: new Date()
    })
    mockAgentChatService.isConnected.mockReturnValue(true)
    mockAgentChatService.connectWebSocket.mockResolvedValue(undefined)
    mockAgentChatService.sendMessage.mockResolvedValue(undefined)
    
    // Replace the mocked service
    vi.mocked(agentChatService).createSession = mockAgentChatService.createSession
    vi.mocked(agentChatService).getSession = mockAgentChatService.getSession
    vi.mocked(agentChatService).sendMessage = mockAgentChatService.sendMessage
    vi.mocked(agentChatService).connectWebSocket = mockAgentChatService.connectWebSocket
    vi.mocked(agentChatService).disconnectWebSocket = mockAgentChatService.disconnectWebSocket
    vi.mocked(agentChatService).isConnected = mockAgentChatService.isConnected
    vi.mocked(agentChatService).onStatusChange = mockAgentChatService.onStatusChange
    vi.mocked(agentChatService).offStatusChange = mockAgentChatService.offStatusChange
    vi.mocked(agentChatService).manualReconnect = mockAgentChatService.manualReconnect
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Query Execution and Loading States', () => {
    it('should initialize RAG session on mount', async () => {
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(mockAgentChatService.createSession).toHaveBeenCalledWith(undefined, 'rag')
        expect(mockAgentChatService.getSession).toHaveBeenCalledWith(mockSessionId)
        expect(mockAgentChatService.connectWebSocket).toHaveBeenCalledWith(
          mockSessionId,
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Function)
        )
      })
    })

    it('should display loading state during query execution', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response to simulate loading
      let resolveMessage: (value: any) => void
      mockAgentChatService.sendMessage.mockImplementation(() => 
        new Promise(resolve => { resolveMessage = resolve })
      )
      
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('rag-chat-panel')).toBeInTheDocument()
      })
      
      const input = screen.getByPlaceholder(/ask archon/i)
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      await user.type(input, 'What is React?')
      await user.click(sendButton)
      
      // Should show typing indicator
      expect(screen.getByText(/archon is thinking/i)).toBeInTheDocument()
      
      // Resolve the message
      resolveMessage!(undefined)
      
      await waitFor(() => {
        expect(screen.queryByText(/archon is thinking/i)).not.toBeInTheDocument()
      })
    })

    it('should handle query execution correctly', async () => {
      const user = userEvent.setup()
      
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('rag-chat-panel')).toBeInTheDocument()
      })
      
      const input = screen.getByPlaceholder(/ask archon/i)
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      await user.type(input, 'Explain TypeScript interfaces')
      await user.click(sendButton)
      
      expect(mockAgentChatService.sendMessage).toHaveBeenCalledWith(
        mockSessionId,
        'Explain TypeScript interfaces'
      )
      
      // Input should be cleared after sending
      expect(input).toHaveValue('')
    })

    it('should support keyboard shortcut for sending queries', async () => {
      const user = userEvent.setup()
      
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('rag-chat-panel')).toBeInTheDocument()
      })
      
      const input = screen.getByPlaceholder(/ask archon/i)
      
      await user.type(input, 'What is Docker?')
      await user.keyboard('{Enter}')
      
      expect(mockAgentChatService.sendMessage).toHaveBeenCalledWith(
        mockSessionId,
        'What is Docker?'
      )
    })
  })

  describe('Result Display and Formatting', () => {
    it('should display RAG agent responses with proper formatting', async () => {
      const mockRagResponse: ChatMessage = {
        id: '2',
        content: '**React** is a JavaScript library for building user interfaces.\n\n```jsx\nfunction App() {\n  return <div>Hello World</div>\n}\n```',
        sender: 'agent',
        timestamp: new Date(),
        agent_type: 'rag',
        metadata: { sources: ['react-docs'] }
      }
      
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('rag-chat-panel')).toBeInTheDocument()
      })
      
      // Simulate receiving a RAG response
      const onMessageCallback = mockAgentChatService.connectWebSocket.mock.calls[0][1]
      onMessageCallback(mockRagResponse)
      
      await waitFor(() => {
        // Should render markdown formatting
        expect(screen.getByText('React')).toBeInTheDocument()
        expect(screen.getByText('is a JavaScript library for building user interfaces.')).toBeInTheDocument()
        // Code block should be rendered
        expect(screen.getByText('function App() {')).toBeInTheDocument()
      })
    })

    it('should display user messages correctly', async () => {
      const mockUserMessage: ChatMessage = {
        id: '3',
        content: 'What is React?',
        sender: 'user',
        timestamp: new Date(),
        agent_type: 'rag',
        metadata: {}
      }
      
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('rag-chat-panel')).toBeInTheDocument()
      })
      
      // Simulate receiving a user message
      const onMessageCallback = mockAgentChatService.connectWebSocket.mock.calls[0][1]
      onMessageCallback(mockUserMessage)
      
      await waitFor(() => {
        expect(screen.getByText('What is React?')).toBeInTheDocument()
      })
    })

    it('should handle streaming responses', async () => {
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('rag-chat-panel')).toBeInTheDocument()
      })
      
      // Simulate streaming start
      const onStreamingCallback = mockAgentChatService.connectWebSocket.mock.calls[0][2]
      onStreamingCallback('This is a streaming response...')
      
      await waitFor(() => {
        expect(screen.getByText('This is a streaming response...')).toBeInTheDocument()
      })
    })

    it('should auto-scroll to latest messages', async () => {
      const scrollIntoViewMock = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoViewMock
      
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('rag-chat-panel')).toBeInTheDocument()
      })
      
      const mockMessage: ChatMessage = {
        id: '4',
        content: 'New message',
        sender: 'agent',
        timestamp: new Date(),
        agent_type: 'rag',
        metadata: {}
      }
      
      // Simulate receiving a new message
      const onMessageCallback = mockAgentChatService.connectWebSocket.mock.calls[0][1]
      onMessageCallback(mockMessage)
      
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled()
      })
    })
  })

  describe('Source Filtering', () => {
    it('should display source information from RAG responses', async () => {
      const mockRagResponseWithSources: ChatMessage = {
        id: '5',
        content: 'React is a JavaScript library.',
        sender: 'agent',
        timestamp: new Date(),
        agent_type: 'rag',
        metadata: { 
          sources: ['react-docs', 'mdn-web-docs'],
          source_urls: ['https://react.dev/', 'https://developer.mozilla.org/']
        }
      }
      
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('rag-chat-panel')).toBeInTheDocument()
      })
      
      // Simulate receiving a RAG response with sources
      const onMessageCallback = mockAgentChatService.connectWebSocket.mock.calls[0][1]
      onMessageCallback(mockRagResponseWithSources)
      
      await waitFor(() => {
        expect(screen.getByText('React is a JavaScript library.')).toBeInTheDocument()
        // Check if source indicators are present (implementation may vary)
        // This would need to be adjusted based on actual UI implementation
      })
    })
  })

  describe('Error Handling', () => {
    it('should display connection error when WebSocket fails', async () => {
      mockAgentChatService.connectWebSocket.mockRejectedValue(new Error('WebSocket connection failed'))
      
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByText(/connection error/i)).toBeInTheDocument()
      })
    })

    it('should handle session creation errors', async () => {
      mockAgentChatService.createSession.mockRejectedValue(new Error('Failed to create session'))
      
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByText(/failed to create session/i)).toBeInTheDocument()
      })
    })

    it('should display offline status when connection is lost', async () => {
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('rag-chat-panel')).toBeInTheDocument()
      })
      
      // Simulate connection status change to offline
      const onStatusCallback = mockAgentChatService.onStatusChange.mock.calls[0][1]
      onStatusCallback('offline')
      
      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument()
      })
    })

    it('should provide reconnection capability', async () => {
      const user = userEvent.setup()
      mockAgentChatService.manualReconnect.mockResolvedValue(true)
      
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('rag-chat-panel')).toBeInTheDocument()
      })
      
      // Simulate offline status
      const onStatusCallback = mockAgentChatService.onStatusChange.mock.calls[0][1]
      onStatusCallback('offline')
      
      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument()
      })
      
      // Look for reconnect button and click it
      const reconnectButton = screen.getByRole('button', { name: /reconnect/i })
      await user.click(reconnectButton)
      
      expect(mockAgentChatService.manualReconnect).toHaveBeenCalledWith(mockSessionId)
    })

    it('should handle message sending errors gracefully', async () => {
      const user = userEvent.setup()
      mockAgentChatService.sendMessage.mockRejectedValue(new Error('Failed to send message'))
      
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('rag-chat-panel')).toBeInTheDocument()
      })
      
      const input = screen.getByPlaceholder(/ask archon/i)
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      await user.type(input, 'Test message')
      await user.click(sendButton)
      
      // Should show error state or retry option
      await waitFor(() => {
        expect(screen.getByText(/failed to send/i)).toBeInTheDocument()
      })
    })

    it('should disable WebSocket when environment variable is false', async () => {
      import.meta.env.VITE_ENABLE_WEBSOCKET = 'false'
      
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByText(/agent chat is currently disabled/i)).toBeInTheDocument()
        expect(mockAgentChatService.connectWebSocket).not.toHaveBeenCalled()
      })
    })
  })

  describe('Panel Resizing', () => {
    it('should support drag-to-resize functionality', async () => {
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('rag-chat-panel')).toBeInTheDocument()
      })
      
      const dragHandle = screen.getByTestId('rag-chat-panel').querySelector('[class*="cursor-ew-resize"]')
      expect(dragHandle).toBeInTheDocument()
      
      // Simulate drag event
      fireEvent.mouseDown(dragHandle!)
      fireEvent.mouseMove(dragHandle!, { clientX: 500 })
      fireEvent.mouseUp(dragHandle!)
      
      // Panel should have been resized (implementation-specific assertions)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('rag-chat-panel')).toBeInTheDocument()
      })
      
      const input = screen.getByPlaceholder(/ask archon/i)
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      expect(input).toHaveAttribute('type', 'text')
      expect(sendButton).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(<ArchonChatPanel data-testid="rag-chat-panel" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('rag-chat-panel')).toBeInTheDocument()
      })
      
      // Tab to input field
      await user.tab()
      const input = screen.getByPlaceholder(/ask archon/i)
      expect(input).toHaveFocus()
      
      // Tab to send button
      await user.tab()
      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toHaveFocus()
    })
  })
})