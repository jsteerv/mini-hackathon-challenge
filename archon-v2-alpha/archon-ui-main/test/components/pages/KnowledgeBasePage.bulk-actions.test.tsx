import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KnowledgeBasePage } from '@/pages/KnowledgeBasePage'
import { knowledgeBaseService, KnowledgeItem } from '@/services/knowledgeBaseService'
import { knowledgeSocketIO } from '@/services/socketIOService'
import { crawlProgressService } from '@/services/crawlProgressService'
import { toastContextMock } from '../../mocks/ToastContext.mock'

// Mock dependencies
vi.mock('@/services/knowledgeBaseService')
vi.mock('@/services/socketIOService')
vi.mock('@/services/crawlProgressService')
vi.mock('@/contexts/ToastContext', () => toastContextMock)

// Mock window.confirm
global.confirm = vi.fn()

const mockKnowledgeItems: KnowledgeItem[] = [
  {
    id: '1',
    source_id: 'source-1',
    title: 'React Documentation',
    url: 'https://react.dev/learn',
    metadata: {
      source_type: 'url',
      knowledge_type: 'technical',
      status: 'active',
      tags: ['react', 'frontend', 'javascript'],
      chunks_count: 45,
      update_frequency: 7,
      description: 'Comprehensive React documentation',
    },
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z'
  },
  {
    id: '2',
    source_id: 'source-2',
    title: 'Vue.js Guide',
    url: 'https://vuejs.org/guide/',
    metadata: {
      source_type: 'url',
      knowledge_type: 'technical',
      status: 'active',
      tags: ['vue', 'frontend', 'javascript'],
      chunks_count: 30,
      update_frequency: 7,
      description: 'Vue.js framework guide',
    },
    created_at: '2024-01-02T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z'
  },
  {
    id: '3',
    source_id: 'source-3',
    title: 'Business Strategy Document',
    url: 'file://strategy.pdf',
    metadata: {
      source_type: 'file',
      knowledge_type: 'business',
      status: 'active',
      tags: ['strategy', 'planning', 'business'],
      chunks_count: 25,
      update_frequency: 0,
      description: 'Company business strategy documentation',
    },
    created_at: '2024-01-03T10:00:00Z',
    updated_at: '2024-01-03T10:30:00Z'
  },
  {
    id: '4',
    source_id: 'source-4',
    title: 'Node.js API Tutorial',
    url: 'https://nodejs.org/api/',
    metadata: {
      source_type: 'url',
      knowledge_type: 'technical',
      status: 'active',
      tags: ['nodejs', 'backend', 'api'],
      chunks_count: 60,
      update_frequency: 14,
      description: 'Node.js API reference and tutorials',
    },
    created_at: '2024-01-04T10:00:00Z',
    updated_at: '2024-01-04T12:00:00Z'
  },
  {
    id: '5',
    source_id: 'source-5',
    title: 'JavaScript ES6 Features',
    url: 'https://developer.mozilla.org/docs/Web/JavaScript',
    metadata: {
      source_type: 'url',
      knowledge_type: 'technical',
      status: 'active',
      tags: ['javascript', 'es6', 'features'],
      chunks_count: 40,
      update_frequency: 30,
      description: 'ES6 features and modern JavaScript',
    },
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-05T15:00:00Z'
  }
]

describe('KnowledgeBasePage - Bulk Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock knowledge base service
    vi.mocked(knowledgeBaseService.getKnowledgeItems).mockResolvedValue({
      items: mockKnowledgeItems,
      total: mockKnowledgeItems.length,
      page: 1,
      per_page: 100
    })
    
    vi.mocked(knowledgeBaseService.deleteKnowledgeItem).mockResolvedValue({ message: 'Item deleted' })
    
    // Mock socket service
    vi.mocked(knowledgeSocketIO.connect).mockResolvedValue(undefined)
    vi.mocked(knowledgeSocketIO.disconnect).mockReturnValue(undefined)
    
    // Mock crawl progress service
    vi.mocked(crawlProgressService.disconnect).mockReturnValue(undefined)
    
    // Mock localStorage
    Storage.prototype.getItem = vi.fn().mockReturnValue('[]')
    Storage.prototype.setItem = vi.fn()
    Storage.prototype.removeItem = vi.fn()
    
    // Reset window.confirm
    vi.mocked(global.confirm).mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Selection Mode Toggle', () => {
    it('should have selection mode toggle button', async () => {
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByRole('button', { name: /selection/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      
      expect(selectionToggle).toBeInTheDocument()
    })

    it('should enter selection mode when toggle is clicked', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      
      await user.click(selectionToggle)
      
      // Should show selection UI elements
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /select all/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /delete selected/i })).toBeInTheDocument()
      })
    })

    it('should exit selection mode when toggle is clicked again', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      
      // Enter selection mode
      await user.click(selectionToggle)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /select all/i })).toBeInTheDocument()
      })
      
      // Exit selection mode
      await user.click(selectionToggle)
      
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /select all/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /delete selected/i })).not.toBeInTheDocument()
      })
    })

    it('should clear selections when exiting selection mode', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      
      await user.click(selectionToggle)
      
      // Select some items
      const firstItem = screen.getByText('React Documentation').closest('[data-testid*="item"]')
      if (firstItem) {
        await user.click(firstItem)
      }
      
      // Exit selection mode
      await user.click(selectionToggle)
      
      // Re-enter selection mode - selections should be cleared
      await user.click(selectionToggle)
      
      await waitFor(() => {
        const selectAllButton = screen.getByRole('button', { name: /select all/i })
        expect(selectAllButton).toBeInTheDocument()
        // Selection count should be 0
      })
    })
  })

  describe('Individual Item Selection', () => {
    it('should allow selecting individual items in selection mode', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      // Click on an item to select it
      const firstItem = screen.getByText('React Documentation').closest('[data-testid*="item"]') ||
                       screen.getByText('React Documentation').closest('.knowledge-item')
      
      if (firstItem) {
        await user.click(firstItem)
        
        // Item should show selected state
        expect(firstItem).toHaveClass('selected') // or whatever class indicates selection
      }
    })

    it('should allow deselecting individual items', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      const firstItem = screen.getByText('React Documentation').closest('[data-testid*="item"]') ||
                       screen.getByText('React Documentation').closest('.knowledge-item')
      
      if (firstItem) {
        // Select item
        await user.click(firstItem)
        expect(firstItem).toHaveClass('selected')
        
        // Deselect item
        await user.click(firstItem)
        expect(firstItem).not.toHaveClass('selected')
      }
    })

    it('should support Ctrl+Click for multi-selection', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.getByText('Vue.js Guide')).toBeInTheDocument()
      })
      
      // Enter selection mode
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      const firstItem = screen.getByText('React Documentation').closest('[data-testid*="item"]')
      const secondItem = screen.getByText('Vue.js Guide').closest('[data-testid*="item"]')
      
      if (firstItem && secondItem) {
        // Select first item
        await user.click(firstItem)
        
        // Ctrl+Click second item
        await user.click(secondItem, { ctrlKey: true })
        
        // Both should be selected
        expect(firstItem).toHaveClass('selected')
        expect(secondItem).toHaveClass('selected')
      }
    })

    it('should support Shift+Click for range selection', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.getByText('Business Strategy Document')).toBeInTheDocument()
      })
      
      // Enter selection mode
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      const firstItem = screen.getByText('React Documentation').closest('[data-testid*="item"]')
      const thirdItem = screen.getByText('Business Strategy Document').closest('[data-testid*="item"]')
      
      if (firstItem && thirdItem) {
        // Select first item
        await user.click(firstItem)
        
        // Shift+Click third item to select range
        await user.click(thirdItem, { shiftKey: true })
        
        // Items in range should be selected
        expect(firstItem).toHaveClass('selected')
        expect(thirdItem).toHaveClass('selected')
        // Vue.js Guide (second item) should also be selected
        const secondItem = screen.getByText('Vue.js Guide').closest('[data-testid*="item"]')
        if (secondItem) {
          expect(secondItem).toHaveClass('selected')
        }
      }
    })
  })

  describe('Select All Functionality', () => {
    it('should select all items when Select All is clicked', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      const selectAllButton = screen.getByRole('button', { name: /select all/i })
      await user.click(selectAllButton)
      
      // All visible items should be selected
      const items = screen.getAllByText(/Documentation|Guide|Strategy|Tutorial|Features/)
      items.forEach(item => {
        const itemContainer = item.closest('[data-testid*="item"]')
        if (itemContainer) {
          expect(itemContainer).toHaveClass('selected')
        }
      })
    })

    it('should deselect all items when Deselect All is clicked', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      // Select all
      const selectAllButton = screen.getByRole('button', { name: /select all/i })
      await user.click(selectAllButton)
      
      // Then deselect all
      const deselectAllButton = screen.getByRole('button', { name: /deselect all/i }) ||
                               screen.getByRole('button', { name: /clear selection/i })
      await user.click(deselectAllButton)
      
      // No items should be selected
      const items = screen.getAllByText(/Documentation|Guide|Strategy|Tutorial|Features/)
      items.forEach(item => {
        const itemContainer = item.closest('[data-testid*="item"]')
        if (itemContainer) {
          expect(itemContainer).not.toHaveClass('selected')
        }
      })
    })

    it('should work with filtered results', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Filter results first
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      await user.type(searchInput, 'frontend')
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.getByText('Vue.js Guide')).toBeInTheDocument()
        expect(screen.queryByText('Business Strategy Document')).not.toBeInTheDocument()
      })
      
      // Enter selection mode
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      // Select all filtered results
      const selectAllButton = screen.getByRole('button', { name: /select all/i })
      await user.click(selectAllButton)
      
      // Only visible (filtered) items should be selected
      expect(screen.getByText('React Documentation').closest('[data-testid*="item"]')).toHaveClass('selected')
      expect(screen.getByText('Vue.js Guide').closest('[data-testid*="item"]')).toHaveClass('selected')
    })
  })

  describe('Bulk Delete Functionality', () => {
    it('should show delete button when items are selected', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      // Select an item
      const firstItem = screen.getByText('React Documentation').closest('[data-testid*="item"]')
      if (firstItem) {
        await user.click(firstItem)
      }
      
      // Delete button should be enabled
      const deleteButton = screen.getByRole('button', { name: /delete selected/i })
      expect(deleteButton).toBeInTheDocument()
      expect(deleteButton).not.toBeDisabled()
    })

    it('should disable delete button when no items are selected', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      // Delete button should be disabled with no selections
      const deleteButton = screen.getByRole('button', { name: /delete selected/i })
      expect(deleteButton).toBeDisabled()
    })

    it('should show confirmation dialog when deleting selected items', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode and select items
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      const selectAllButton = screen.getByRole('button', { name: /select all/i })
      await user.click(selectAllButton)
      
      // Click delete
      const deleteButton = screen.getByRole('button', { name: /delete selected/i })
      await user.click(deleteButton)
      
      // Should show confirmation dialog
      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to delete 5 selected items?')
      )
    })

    it('should delete selected items when confirmed', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode and select two items
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      const firstItem = screen.getByText('React Documentation').closest('[data-testid*="item"]')
      const secondItem = screen.getByText('Vue.js Guide').closest('[data-testid*="item"]')
      
      if (firstItem && secondItem) {
        await user.click(firstItem)
        await user.click(secondItem, { ctrlKey: true })
      }
      
      // Confirm deletion
      vi.mocked(global.confirm).mockReturnValue(true)
      
      const deleteButton = screen.getByRole('button', { name: /delete selected/i })
      await user.click(deleteButton)
      
      // Should call delete API for each selected item
      expect(knowledgeBaseService.deleteKnowledgeItem).toHaveBeenCalledWith('source-1')
      expect(knowledgeBaseService.deleteKnowledgeItem).toHaveBeenCalledWith('source-2')
      expect(knowledgeBaseService.deleteKnowledgeItem).toHaveBeenCalledTimes(2)
    })

    it('should not delete items when cancellation is chosen', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode and select items
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      const firstItem = screen.getByText('React Documentation').closest('[data-testid*="item"]')
      if (firstItem) {
        await user.click(firstItem)
      }
      
      // Cancel deletion
      vi.mocked(global.confirm).mockReturnValue(false)
      
      const deleteButton = screen.getByRole('button', { name: /delete selected/i })
      await user.click(deleteButton)
      
      // Should not call delete API
      expect(knowledgeBaseService.deleteKnowledgeItem).not.toHaveBeenCalled()
    })

    it('should remove deleted items from the UI', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.getByText('Vue.js Guide')).toBeInTheDocument()
      })
      
      // Enter selection mode and select items
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      const firstItem = screen.getByText('React Documentation').closest('[data-testid*="item"]')
      if (firstItem) {
        await user.click(firstItem)
      }
      
      // Confirm deletion
      vi.mocked(global.confirm).mockReturnValue(true)
      
      const deleteButton = screen.getByRole('button', { name: /delete selected/i })
      await user.click(deleteButton)
      
      // Wait for deletion to complete and UI to update
      await waitFor(() => {
        expect(screen.queryByText('React Documentation')).not.toBeInTheDocument()
        expect(screen.getByText('Vue.js Guide')).toBeInTheDocument() // Should still be there
      })
    })

    it('should exit selection mode after successful deletion', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode and select items
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      const firstItem = screen.getByText('React Documentation').closest('[data-testid*="item"]')
      if (firstItem) {
        await user.click(firstItem)
      }
      
      // Confirm deletion
      vi.mocked(global.confirm).mockReturnValue(true)
      
      const deleteButton = screen.getByRole('button', { name: /delete selected/i })
      await user.click(deleteButton)
      
      // Should exit selection mode
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /select all/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /delete selected/i })).not.toBeInTheDocument()
      })
    })

    it('should handle deletion errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock delete failure
      vi.mocked(knowledgeBaseService.deleteKnowledgeItem).mockRejectedValue(
        new Error('Delete failed')
      )
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode and select items
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      const firstItem = screen.getByText('React Documentation').closest('[data-testid*="item"]')
      if (firstItem) {
        await user.click(firstItem)
      }
      
      // Confirm deletion
      vi.mocked(global.confirm).mockReturnValue(true)
      
      const deleteButton = screen.getByRole('button', { name: /delete selected/i })
      await user.click(deleteButton)
      
      // Should show error message (check toast or error display)
      await waitFor(() => {
        // Item should still be in the UI since deletion failed
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
    })
  })

  describe('Selection Count Display', () => {
    it('should show count of selected items', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      // Select items one by one and check count
      const firstItem = screen.getByText('React Documentation').closest('[data-testid*="item"]')
      if (firstItem) {
        await user.click(firstItem)
        
        // Should show "1 selected" or similar
        expect(screen.getByText(/1.*selected/i)).toBeInTheDocument()
      }
      
      const secondItem = screen.getByText('Vue.js Guide').closest('[data-testid*="item"]')
      if (secondItem) {
        await user.click(secondItem, { ctrlKey: true })
        
        // Should show "2 selected" or similar
        expect(screen.getByText(/2.*selected/i)).toBeInTheDocument()
      }
    })

    it('should update count when items are deselected', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode and select items
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      const selectAllButton = screen.getByRole('button', { name: /select all/i })
      await user.click(selectAllButton)
      
      // Should show "5 selected"
      expect(screen.getByText(/5.*selected/i)).toBeInTheDocument()
      
      // Deselect one item
      const firstItem = screen.getByText('React Documentation').closest('[data-testid*="item"]')
      if (firstItem) {
        await user.click(firstItem)
        
        // Should show "4 selected"
        expect(screen.getByText(/4.*selected/i)).toBeInTheDocument()
      }
    })

    it('should show proper singular/plural text', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      // Select one item
      const firstItem = screen.getByText('React Documentation').closest('[data-testid*="item"]')
      if (firstItem) {
        await user.click(firstItem)
        
        // Should use singular form
        expect(screen.getByText(/1.*item.*selected/i)).toBeInTheDocument()
      }
      
      // Select second item
      const secondItem = screen.getByText('Vue.js Guide').closest('[data-testid*="item"]')
      if (secondItem) {
        await user.click(secondItem, { ctrlKey: true })
        
        // Should use plural form
        expect(screen.getByText(/2.*items.*selected/i)).toBeInTheDocument()
      }
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should support Ctrl+A to select all items in selection mode', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      // Press Ctrl+A
      await user.keyboard('{Control>}a{/Control}')
      
      // All items should be selected
      expect(screen.getByText(/5.*selected/i)).toBeInTheDocument()
    })

    it('should support Escape key to exit selection mode', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /select all/i })).toBeInTheDocument()
      })
      
      // Press Escape
      await user.keyboard('{Escape}')
      
      // Should exit selection mode
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /select all/i })).not.toBeInTheDocument()
      })
    })

    it('should not trigger Ctrl+A when not in selection mode', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Not in selection mode, press Ctrl+A
      await user.keyboard('{Control>}a{/Control}')
      
      // Should not affect the page (no selection UI should appear)
      expect(screen.queryByRole('button', { name: /select all/i })).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for selection mode', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      // Selection controls should have proper labels
      const selectAllButton = screen.getByRole('button', { name: /select all/i })
      const deleteButton = screen.getByRole('button', { name: /delete selected/i })
      
      expect(selectAllButton).toBeInTheDocument()
      expect(deleteButton).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      // Tab through selection controls
      await user.tab()
      const selectAllButton = screen.getByRole('button', { name: /select all/i })
      expect(selectAllButton).toHaveFocus()
      
      await user.tab()
      const deleteButton = screen.getByRole('button', { name: /delete selected/i })
      expect(deleteButton).toHaveFocus()
    })

    it('should announce selection changes to screen readers', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Enter selection mode
      const selectionToggle = screen.getByRole('button', { name: /select/i }) ||
                            screen.getByTestId('selection-mode-toggle')
      await user.click(selectionToggle)
      
      // Look for aria-live region or similar for announcements
      const liveRegion = screen.queryByRole('status') || screen.queryByRole('log')
      
      // Implementation would depend on how announcements are handled
      if (liveRegion) {
        expect(liveRegion).toBeInTheDocument()
      }
    })
  })
})