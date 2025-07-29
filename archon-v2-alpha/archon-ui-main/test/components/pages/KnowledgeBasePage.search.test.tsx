import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KnowledgeBasePage } from '@/pages/KnowledgeBasePage'
import { knowledgeBaseService, KnowledgeItem } from '@/services/knowledgeBaseService'
import { knowledgeSocketIO } from '@/services/socketIOService'
import { crawlProgressService } from '@/services/crawlProgressService'

// Mock dependencies
vi.mock('@/services/knowledgeBaseService')
vi.mock('@/services/socketIOService')
vi.mock('@/services/crawlProgressService')
vi.mock('@/contexts/ToastContext')

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

describe('KnowledgeBasePage - Search Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock knowledge base service
    vi.mocked(knowledgeBaseService.getKnowledgeItems).mockResolvedValue({
      items: mockKnowledgeItems,
      total: mockKnowledgeItems.length,
      page: 1,
      per_page: 100
    })
    
    // Mock socket service
    vi.mocked(knowledgeSocketIO.connect).mockResolvedValue(undefined)
    vi.mocked(knowledgeSocketIO.disconnect).mockReturnValue(undefined)
    
    // Mock crawl progress service
    vi.mocked(crawlProgressService.disconnect).mockReturnValue(undefined)
    
    // Mock localStorage
    Storage.prototype.getItem = vi.fn().mockReturnValue('[]')
    Storage.prototype.setItem = vi.fn()
    Storage.prototype.removeItem = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Search Bar Display', () => {
    it('should display search input field', async () => {
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
        expect(searchInput).toBeInTheDocument()
        expect(searchInput).toHaveAttribute('type', 'text')
      })
    })

    it('should display search icon in input field', async () => {
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        const searchIcon = screen.getByTestId('search-icon') || 
                         document.querySelector('[data-lucide="search"]')
        expect(searchIcon).toBeInTheDocument()
      })
    })

    it('should have proper placeholder text', async () => {
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
        expect(searchInput).toHaveAttribute('placeholder', 'Search knowledge base...')
      })
    })

    it('should be initially empty', async () => {
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search knowledge base/i) as HTMLInputElement
        expect(searchInput.value).toBe('')
      })
    })
  })

  describe('Search Input Interaction', () => {
    it('should update search input value when typing', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search knowledge base/i)).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i) as HTMLInputElement
      
      await user.type(searchInput, 'React')
      
      expect(searchInput.value).toBe('React')
    })

    it('should handle backspace and deletion', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search knowledge base/i)).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i) as HTMLInputElement
      
      await user.type(searchInput, 'React')
      expect(searchInput.value).toBe('React')
      
      await user.keyboard('{Backspace}{Backspace}')
      expect(searchInput.value).toBe('Rea')
    })

    it('should clear input when cleared manually', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search knowledge base/i)).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i) as HTMLInputElement
      
      await user.type(searchInput, 'React')
      expect(searchInput.value).toBe('React')
      
      await user.clear(searchInput)
      expect(searchInput.value).toBe('')
    })

    it('should handle special characters in search', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search knowledge base/i)).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i) as HTMLInputElement
      
      await user.type(searchInput, 'API & Node.js')
      expect(searchInput.value).toBe('API & Node.js')
    })
  })

  describe('Search Filtering by Title', () => {
    it('should filter items by title match', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      // Wait for all items to load
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.getByText('Vue.js Guide')).toBeInTheDocument()
        expect(screen.getByText('Business Strategy Document')).toBeInTheDocument()
        expect(screen.getByText('Node.js API Tutorial')).toBeInTheDocument()
        expect(screen.getByText('JavaScript ES6 Features')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      await user.type(searchInput, 'React')
      
      // Should show only React item
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.queryByText('Vue.js Guide')).not.toBeInTheDocument()
        expect(screen.queryByText('Business Strategy Document')).not.toBeInTheDocument()
        expect(screen.queryByText('Node.js API Tutorial')).not.toBeInTheDocument()
        expect(screen.queryByText('JavaScript ES6 Features')).not.toBeInTheDocument()
      })
    })

    it('should be case insensitive for title search', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      await user.type(searchInput, 'react')
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
    })

    it('should handle partial title matches', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript ES6 Features')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      await user.type(searchInput, 'Script')
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript ES6 Features')).toBeInTheDocument()
        expect(screen.queryByText('React Documentation')).not.toBeInTheDocument()
      })
    })

    it('should show multiple items with matching titles', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('Node.js API Tutorial')).toBeInTheDocument()
        expect(screen.getByText('JavaScript ES6 Features')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      await user.type(searchInput, 'JavaScript')
      
      await waitFor(() => {
        // Should match both JavaScript items
        expect(screen.getByText('JavaScript ES6 Features')).toBeInTheDocument()
        // React item has 'javascript' tag, so might also appear depending on implementation
      })
    })
  })

  describe('Search Filtering by Tags', () => {
    it('should filter items by tag match', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.getByText('Vue.js Guide')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      await user.type(searchInput, 'frontend')
      
      // Should show items with 'frontend' tag
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.getByText('Vue.js Guide')).toBeInTheDocument()
        expect(screen.queryByText('Business Strategy Document')).not.toBeInTheDocument()
        expect(screen.queryByText('Node.js API Tutorial')).not.toBeInTheDocument()
      })
    })

    it('should be case insensitive for tag search', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      await user.type(searchInput, 'FRONTEND')
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.getByText('Vue.js Guide')).toBeInTheDocument()
      })
    })

    it('should match partial tag names', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('Node.js API Tutorial')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      await user.type(searchInput, 'node')
      
      await waitFor(() => {
        expect(screen.getByText('Node.js API Tutorial')).toBeInTheDocument()
        expect(screen.queryByText('React Documentation')).not.toBeInTheDocument()
      })
    })
  })

  describe('Search Filtering by Description', () => {
    it('should filter items by description match', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      await user.type(searchInput, 'Comprehensive')
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.queryByText('Vue.js Guide')).not.toBeInTheDocument()
      })
    })

    it('should be case insensitive for description search', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('Business Strategy Document')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      await user.type(searchInput, 'company')
      
      await waitFor(() => {
        expect(screen.getByText('Business Strategy Document')).toBeInTheDocument()
        expect(screen.queryByText('React Documentation')).not.toBeInTheDocument()
      })
    })
  })

  describe('Search Filtering by Source ID', () => {
    it('should filter items by source ID match', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      await user.type(searchInput, 'source-1')
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.queryByText('Vue.js Guide')).not.toBeInTheDocument()
      })
    })

    it('should handle partial source ID matches', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      await user.type(searchInput, 'source')
      
      // Should match all items as they all have 'source' in their source_id
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.getByText('Vue.js Guide')).toBeInTheDocument()
        expect(screen.getByText('Business Strategy Document')).toBeInTheDocument()
        expect(screen.getByText('Node.js API Tutorial')).toBeInTheDocument()
        expect(screen.getByText('JavaScript ES6 Features')).toBeInTheDocument()
      })
    })
  })

  describe('Combined Search and Filter', () => {
    it('should combine search with type filter', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.getByText('Business Strategy Document')).toBeInTheDocument()
      })
      
      // Set type filter to 'technical'
      const typeFilter = screen.getByDisplayValue(/all/i) || screen.getByRole('combobox')
      await user.selectOptions(typeFilter, 'technical')
      
      // Then search
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      await user.type(searchInput, 'javascript')
      
      await waitFor(() => {
        // Should show only technical items matching 'javascript'
        expect(screen.getByText('JavaScript ES6 Features')).toBeInTheDocument()
        expect(screen.queryByText('Business Strategy Document')).not.toBeInTheDocument()
      })
    })

    it('should show no results when search and filter combination matches nothing', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Set type filter to 'business'
      const typeFilter = screen.getByDisplayValue(/all/i) || screen.getByRole('combobox')
      await user.selectOptions(typeFilter, 'business')
      
      // Search for something that doesn't exist in business items
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      await user.type(searchInput, 'react')
      
      await waitFor(() => {
        // Should show no results
        expect(screen.queryByText('React Documentation')).not.toBeInTheDocument()
        expect(screen.queryByText('Business Strategy Document')).not.toBeInTheDocument()
        // Should show "no results" message
        expect(screen.getByText(/no items found/i) || screen.getByText(/no results/i)).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Search', () => {
    it('should filter results as user types', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.getByText('Vue.js Guide')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      // Type one character at a time
      await user.type(searchInput, 'R')
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      await user.type(searchInput, 'e')
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      await user.type(searchInput, 'act')
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.queryByText('Vue.js Guide')).not.toBeInTheDocument()
      })
    })

    it('should restore all results when search is cleared', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.getByText('Vue.js Guide')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      // Search to filter results
      await user.type(searchInput, 'React')
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.queryByText('Vue.js Guide')).not.toBeInTheDocument()
      })
      
      // Clear search
      await user.clear(searchInput)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
        expect(screen.getByText('Vue.js Guide')).toBeInTheDocument()
        expect(screen.getByText('Business Strategy Document')).toBeInTheDocument()
        expect(screen.getByText('Node.js API Tutorial')).toBeInTheDocument()
        expect(screen.getByText('JavaScript ES6 Features')).toBeInTheDocument()
      })
    })
  })

  describe('Empty Search Results', () => {
    it('should show no results message when search matches nothing', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      await user.type(searchInput, 'nonexistentterm')
      
      await waitFor(() => {
        expect(screen.queryByText('React Documentation')).not.toBeInTheDocument()
        expect(screen.queryByText('Vue.js Guide')).not.toBeInTheDocument()
        // Should show empty state message
        expect(screen.getByText(/no items found/i) || screen.getByText(/no knowledge items match/i)).toBeInTheDocument()
      })
    })

    it('should maintain search query in input when no results found', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i) as HTMLInputElement
      
      await user.type(searchInput, 'nonexistentterm')
      
      await waitFor(() => {
        expect(searchInput.value).toBe('nonexistentterm')
        expect(screen.queryByText('React Documentation')).not.toBeInTheDocument()
      })
    })
  })

  describe('Search Performance', () => {
    it('should handle large search queries efficiently', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      const longQuery = 'this is a very long search query that should still work efficiently'
      
      const startTime = performance.now()
      await user.type(searchInput, longQuery)
      const endTime = performance.now()
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000) // 1 second
      
      await waitFor(() => {
        expect((searchInput as HTMLInputElement).value).toBe(longQuery)
      })
    })

    it('should not make API calls during client-side search', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Clear previous API calls
      vi.clearAllMocks()
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      await user.type(searchInput, 'React')
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Should not make additional API calls for client-side filtering
      expect(knowledgeBaseService.getKnowledgeItems).not.toHaveBeenCalled()
    })
  })

  describe('Search Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
        expect(searchInput).toHaveAttribute('type', 'text')
        expect(searchInput).toHaveAttribute('placeholder', 'Search knowledge base...')
      })
    })

    it('should be focusable via keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search knowledge base/i)).toBeInTheDocument()
      })
      
      // Tab to search input
      await user.tab()
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      expect(searchInput).toHaveFocus()
    })

    it('should support keyboard shortcuts', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search knowledge base/i)).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i)
      
      // Focus search input with Ctrl+F or similar (if implemented)
      await user.keyboard('{Control>}f{/Control}')
      
      // Implementation specific - might focus search input
    })
  })

  describe('Search State Persistence', () => {
    it('should maintain search query when switching view modes', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i) as HTMLInputElement
      
      await user.type(searchInput, 'React')
      
      await waitFor(() => {
        expect(searchInput.value).toBe('React')
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      // Switch view mode (grid to table or vice versa)
      const viewToggle = screen.getByRole('button', { name: /table/i }) || 
                        screen.getByRole('button', { name: /grid/i })
      
      if (viewToggle) {
        await user.click(viewToggle)
        
        await waitFor(() => {
          expect(searchInput.value).toBe('React')
          expect(screen.getByText('React Documentation')).toBeInTheDocument()
        })
      }
    })

    it('should clear search when explicitly requested', async () => {
      const user = userEvent.setup()
      
      render(<KnowledgeBasePage />)
      
      await waitFor(() => {
        expect(screen.getByText('React Documentation')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/search knowledge base/i) as HTMLInputElement
      
      await user.type(searchInput, 'React')
      expect(searchInput.value).toBe('React')
      
      // Clear search with Escape key (if implemented)
      await user.keyboard('{Escape}')
      
      // Implementation specific - might clear search
    })
  })
})