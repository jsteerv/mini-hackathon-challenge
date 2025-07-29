import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CrawlingProgressCard } from '@/components/knowledge-base/CrawlingProgressCard'
import { CrawlProgressData } from '@/services/crawlProgressService'
import { knowledgeBaseService } from '@/services/knowledgeBaseService'

// Mock dependencies
vi.mock('@/services/knowledgeBaseService')
vi.mock('@/hooks/useTerminalScroll', () => ({
  useTerminalScroll: () => ({ current: null })
}))

describe('CrawlingProgressCard - Stop Button Functionality', () => {
  const mockOnComplete = vi.fn()
  const mockOnError = vi.fn()
  const mockOnProgress = vi.fn()
  const mockOnRetry = vi.fn()
  const mockOnDismiss = vi.fn()
  const mockOnStop = vi.fn()

  const baseCrawlProgressData: CrawlProgressData = {
    progressId: 'crawl-123',
    currentUrl: 'https://example.com',
    totalPages: 10,
    processedPages: 3,
    percentage: 30,
    status: 'processing',
    message: 'Crawling in progress...',
    logs: ['Starting crawl...', 'Processing page 1...', 'Processing page 2...'],
    crawlType: 'crawl',
    currentStep: 'processing',
    startTime: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(knowledgeBaseService.stopCrawl).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Stop Button Display', () => {
    it('should display stop button during active crawl', () => {
      const progressData = {
        ...baseCrawlProgressData,
        status: 'processing' as const,
      }

      render(
        <CrawlingProgressCard
          progressData={progressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
          data-testid="crawling-progress-card"
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i }) ||
                        screen.getByTestId('stop-crawl-button')
      expect(stopButton).toBeInTheDocument()
    })

    it('should display stop button during crawling status', () => {
      const progressData = {
        ...baseCrawlProgressData,
        status: 'crawling' as const,
      }

      render(
        <CrawlingProgressCard
          progressData={progressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      expect(stopButton).toBeInTheDocument()
      expect(stopButton).not.toBeDisabled()
    })

    it('should display stop button during analyzing status', () => {
      const progressData = {
        ...baseCrawlProgressData,
        status: 'analyzing' as const,
      }

      render(
        <CrawlingProgressCard
          progressData={progressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      expect(stopButton).toBeInTheDocument()
    })

    it('should have proper stop icon', () => {
      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopIcon = screen.getByTestId('stop-icon') || 
                      document.querySelector('[data-lucide="square"]')
      expect(stopIcon).toBeInTheDocument()
    })

    it('should have proper button styling', () => {
      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      expect(stopButton).toHaveClass('bg-red-500') // or appropriate danger styling
    })
  })

  describe('Stop Button Interaction', () => {
    it('should call onStop callback when clicked', async () => {
      const user = userEvent.setup()

      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)

      expect(mockOnStop).toHaveBeenCalledTimes(1)
    })

    it('should show loading state when stopping', async () => {
      const user = userEvent.setup()

      // Mock slow stop operation
      mockOnStop.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)

      // Should show stopping state
      expect(screen.getByRole('button', { name: /stopping/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /stopping/i })).toBeDisabled()
    })

    it('should prevent multiple stop attempts', async () => {
      const user = userEvent.setup()

      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      
      // Click multiple times rapidly
      await user.click(stopButton)
      await user.click(stopButton)
      await user.click(stopButton)

      // Should only call onStop once
      expect(mockOnStop).toHaveBeenCalledTimes(1)
    })

    it('should be disabled when no progressId is available', () => {
      const progressDataWithoutId = {
        ...baseCrawlProgressData,
        progressId: undefined as any,
      }

      render(
        <CrawlingProgressCard
          progressData={progressDataWithoutId}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      expect(stopButton).toBeDisabled()
    })
  })

  describe('Stop Button States', () => {
    it('should hide stop button when crawl is completed', () => {
      const completedProgressData = {
        ...baseCrawlProgressData,
        status: 'completed' as const,
        percentage: 100,
      }

      render(
        <CrawlingProgressCard
          progressData={completedProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.queryByRole('button', { name: /stop/i })
      expect(stopButton).not.toBeInTheDocument()
    })

    it('should hide stop button when crawl has errored', () => {
      const errorProgressData = {
        ...baseCrawlProgressData,
        status: 'error' as const,
        error: 'Crawl failed',
      }

      render(
        <CrawlingProgressCard
          progressData={errorProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.queryByRole('button', { name: /stop/i })
      expect(stopButton).not.toBeInTheDocument()
    })

    it('should hide stop button when crawl is cancelled', () => {
      const cancelledProgressData = {
        ...baseCrawlProgressData,
        status: 'cancelled' as const,
      }

      render(
        <CrawlingProgressCard
          progressData={cancelledProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.queryByRole('button', { name: /stop/i })
      expect(stopButton).not.toBeInTheDocument()
    })

    it('should show stop button for stale crawls', () => {
      const staleProgressData = {
        ...baseCrawlProgressData,
        status: 'stale' as const,
        error: 'No updates received for over 2 minutes',
      }

      render(
        <CrawlingProgressCard
          progressData={staleProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      expect(stopButton).toBeInTheDocument()
    })

    it('should show stop button during reconnecting status', () => {
      const reconnectingProgressData = {
        ...baseCrawlProgressData,
        status: 'reconnecting' as const,
      }

      render(
        <CrawlingProgressCard
          progressData={reconnectingProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      expect(stopButton).toBeInTheDocument()
    })
  })

  describe('Stop Confirmation', () => {
    it('should show confirmation dialog before stopping', async () => {
      const user = userEvent.setup()
      
      // Mock window.confirm
      global.confirm = vi.fn().mockReturnValue(true)

      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)

      // Should show confirmation dialog
      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('stop')
      )
    })

    it('should not stop if user cancels confirmation', async () => {
      const user = userEvent.setup()
      
      // Mock user cancelling confirmation
      global.confirm = vi.fn().mockReturnValue(false)

      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)

      // Should not call onStop if user cancels
      expect(mockOnStop).not.toHaveBeenCalled()
    })

    it('should proceed with stop if user confirms', async () => {
      const user = userEvent.setup()
      
      // Mock user confirming
      global.confirm = vi.fn().mockReturnValue(true)

      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)

      expect(mockOnStop).toHaveBeenCalledTimes(1)
    })
  })

  describe('Different Crawl Types', () => {
    it('should handle stopping URL crawls', async () => {
      const user = userEvent.setup()
      
      const urlCrawlData = {
        ...baseCrawlProgressData,
        crawlType: 'crawl' as const,
        currentUrl: 'https://example.com/docs',
      }

      render(
        <CrawlingProgressCard
          progressData={urlCrawlData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)

      expect(mockOnStop).toHaveBeenCalled()
    })

    it('should handle stopping document uploads', async () => {
      const user = userEvent.setup()
      
      const uploadData = {
        ...baseCrawlProgressData,
        uploadType: 'document' as const,
        fileName: 'document.pdf',
        currentUrl: 'file://document.pdf',
      }

      render(
        <CrawlingProgressCard
          progressData={uploadData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)

      expect(mockOnStop).toHaveBeenCalled()
    })

    it('should handle stopping refresh operations', async () => {
      const user = userEvent.setup()
      
      const refreshData = {
        ...baseCrawlProgressData,
        crawlType: 'refresh' as const,
        currentUrl: 'https://example.com/api',
      }

      render(
        <CrawlingProgressCard
          progressData={refreshData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)

      expect(mockOnStop).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle stop errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock onStop throwing an error
      mockOnStop.mockImplementation(() => {
        throw new Error('Stop failed')
      })

      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)

      // Should handle error gracefully and restore button state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop/i })).not.toBeDisabled()
      })
    })

    it('should revert optimistic UI updates on error', async () => {
      const user = userEvent.setup()
      
      mockOnStop.mockRejectedValue(new Error('Network error'))

      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)

      // Should revert to original state on error
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop/i })).not.toBeDisabled()
      })
    })

    it('should log errors appropriately', async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockOnStop.mockImplementation(() => {
        throw new Error('Stop operation failed')
      })

      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to stop crawl:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Button Text and Styling', () => {
    it('should show "Stop" text normally', () => {
      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
    })

    it('should show "Stopping..." text when stopping', async () => {
      const user = userEvent.setup()
      
      // Mock slow stop operation
      let resolveStop: () => void
      mockOnStop.mockImplementation(() => new Promise(resolve => {
        resolveStop = resolve
      }))

      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)

      expect(screen.getByRole('button', { name: /stopping/i })).toBeInTheDocument()
      
      // Resolve the stop operation
      resolveStop!()
    })

    it('should have proper danger styling', () => {
      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      expect(stopButton).toHaveClass(/red/) // Should have red/danger styling
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      expect(stopButton).toHaveAttribute('type', 'button')
    })

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()

      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      
      // Focus the button
      await user.tab()
      expect(stopButton).toHaveFocus()

      // Activate with Enter key
      await user.keyboard('{Enter}')
      expect(mockOnStop).toHaveBeenCalled()
    })

    it('should activate with Space key', async () => {
      const user = userEvent.setup()

      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      
      await user.tab()
      expect(stopButton).toHaveFocus()

      await user.keyboard(' ')
      expect(mockOnStop).toHaveBeenCalled()
    })

    it('should have proper aria-label for screen readers', () => {
      render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      expect(stopButton).toHaveAttribute('aria-label', expect.stringContaining('stop'))
    })
  })

  describe('Integration with Progress Status', () => {
    it('should update button availability based on status changes', () => {
      const { rerender } = render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      // Initially should show stop button
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()

      // Update to completed status
      const completedData = {
        ...baseCrawlProgressData,
        status: 'completed' as const,
        percentage: 100,
      }

      rerender(
        <CrawlingProgressCard
          progressData={completedData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      // Stop button should be hidden
      expect(screen.queryByRole('button', { name: /stop/i })).not.toBeInTheDocument()
    })

    it('should handle status transitions properly', () => {
      const { rerender } = render(
        <CrawlingProgressCard
          progressData={baseCrawlProgressData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      // From processing to stopping
      const stoppingData = {
        ...baseCrawlProgressData,
        status: 'stopping' as const,
      }

      rerender(
        <CrawlingProgressCard
          progressData={stoppingData}
          onComplete={mockOnComplete}
          onError={mockOnError}
          onStop={mockOnStop}
        />
      )

      // Button should show stopping state
      expect(screen.getByRole('button', { name: /stopping/i })).toBeDisabled()
    })
  })
})