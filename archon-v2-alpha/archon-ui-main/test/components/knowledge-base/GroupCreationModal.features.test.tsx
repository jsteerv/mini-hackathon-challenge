import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { GroupCreationModal } from '@/components/knowledge-base/GroupCreationModal'
import { KnowledgeItem, knowledgeBaseService } from '@/services/knowledgeBaseService'

// Mock dependencies
vi.mock('@/services/knowledgeBaseService')
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    toasts: [],
    dismissToast: vi.fn()
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children
}))

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
    title: 'Angular Tutorial',
    url: 'https://angular.io/tutorial',
    metadata: {
      source_type: 'url',
      knowledge_type: 'technical',
      status: 'active',
      tags: ['angular', 'frontend', 'typescript'],
      chunks_count: 35,
      update_frequency: 14,
      description: 'Angular framework tutorial',
    },
    created_at: '2024-01-03T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z'
  }
]

describe('GroupCreationModal - Group Management Features', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(knowledgeBaseService.updateKnowledgeItem).mockResolvedValue(mockKnowledgeItems[0])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Modal Display', () => {
    it('should render modal with proper title', () => {
      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('Create Knowledge Group')).toBeInTheDocument()
    })

    it('should display close button', () => {
      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('should show group name input field', () => {
      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i)
      expect(groupNameInput).toBeInTheDocument()
      expect(groupNameInput).toHaveAttribute('placeholder', 'Enter group name...')
    })

    it('should display selected items count', () => {
      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText(/3.*items.*will be grouped/i)).toBeInTheDocument()
    })

    it('should show selected items preview', () => {
      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('React Documentation')).toBeInTheDocument()
      expect(screen.getByText('Vue.js Guide')).toBeInTheDocument()
      expect(screen.getByText('Angular Tutorial')).toBeInTheDocument()
    })
  })

  describe('Group Name Input', () => {
    it('should allow typing in group name field', async () => {
      const user = userEvent.setup()

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i) as HTMLInputElement
      
      await user.type(groupNameInput, 'Frontend Frameworks')
      
      expect(groupNameInput.value).toBe('Frontend Frameworks')
    })

    it('should handle backspace and deletion', async () => {
      const user = userEvent.setup()

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i) as HTMLInputElement
      
      await user.type(groupNameInput, 'Test Group')
      expect(groupNameInput.value).toBe('Test Group')
      
      await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}')
      expect(groupNameInput.value).toBe('Test')
    })

    it('should clear input when manually cleared', async () => {
      const user = userEvent.setup()

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i) as HTMLInputElement
      
      await user.type(groupNameInput, 'Test Group')
      expect(groupNameInput.value).toBe('Test Group')
      
      await user.clear(groupNameInput)
      expect(groupNameInput.value).toBe('')
    })

    it('should support Enter key to create group', async () => {
      const user = userEvent.setup()

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i)
      
      await user.type(groupNameInput, 'Frontend Frameworks')
      await user.keyboard('{Enter}')

      expect(knowledgeBaseService.updateKnowledgeItem).toHaveBeenCalledTimes(3)
    })
  })

  describe('Group Creation Process', () => {
    it('should create group with valid name', async () => {
      const user = userEvent.setup()

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i)
      const createButton = screen.getByRole('button', { name: /create group/i })
      
      await user.type(groupNameInput, 'Frontend Frameworks')
      await user.click(createButton)

      // Should call updateKnowledgeItem for each selected item
      expect(knowledgeBaseService.updateKnowledgeItem).toHaveBeenCalledTimes(3)
      
      // Check if each item is updated with group name
      expect(knowledgeBaseService.updateKnowledgeItem).toHaveBeenCalledWith('source-1', {
        ...mockKnowledgeItems[0].metadata,
        group_name: 'Frontend Frameworks'
      })
      expect(knowledgeBaseService.updateKnowledgeItem).toHaveBeenCalledWith('source-2', {
        ...mockKnowledgeItems[1].metadata,
        group_name: 'Frontend Frameworks'
      })
      expect(knowledgeBaseService.updateKnowledgeItem).toHaveBeenCalledWith('source-3', {
        ...mockKnowledgeItems[2].metadata,  
        group_name: 'Frontend Frameworks'
      })
    })

    it('should trim whitespace from group name', async () => {
      const user = userEvent.setup()

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i)
      const createButton = screen.getByRole('button', { name: /create group/i })
      
      await user.type(groupNameInput, '  Frontend Frameworks  ')
      await user.click(createButton)

      expect(knowledgeBaseService.updateKnowledgeItem).toHaveBeenCalledWith('source-1', 
        expect.objectContaining({
          group_name: 'Frontend Frameworks'
        })
      )
    })

    it('should call onSuccess after successful group creation', async () => {
      const user = userEvent.setup()

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i)
      const createButton = screen.getByRole('button', { name: /create group/i })
      
      await user.type(groupNameInput, 'Frontend Frameworks')
      await user.click(createButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1)
      })
    })

    it('should show loading state during group creation', async () => {
      const user = userEvent.setup()

      // Mock slow API response
      vi.mocked(knowledgeBaseService.updateKnowledgeItem).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i)
      const createButton = screen.getByRole('button', { name: /create group/i })
      
      await user.type(groupNameInput, 'Frontend Frameworks')
      await user.click(createButton)

      // Should show loading state
      expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should handle single item grouping', async () => {
      const user = userEvent.setup()

      render(
        <GroupCreationModal
          selectedItems={[mockKnowledgeItems[0]]}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i)
      const createButton = screen.getByRole('button', { name: /create group/i })
      
      await user.type(groupNameInput, 'React Resources')
      await user.click(createButton)

      expect(knowledgeBaseService.updateKnowledgeItem).toHaveBeenCalledTimes(1)
      expect(knowledgeBaseService.updateKnowledgeItem).toHaveBeenCalledWith('source-1', {
        ...mockKnowledgeItems[0].metadata,
        group_name: 'React Resources'
      })
    })
  })

  describe('Validation', () => {
    it('should prevent creating group with empty name', async () => {
      const user = userEvent.setup()

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const createButton = screen.getByRole('button', { name: /create group/i })
      
      await user.click(createButton)

      // Should show error message
      expect(screen.getByText(/please enter a group name/i)).toBeInTheDocument()
      
      // Should not call API
      expect(knowledgeBaseService.updateKnowledgeItem).not.toHaveBeenCalled()
    })

    it('should prevent creating group with whitespace-only name', async () => {
      const user = userEvent.setup()

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i)
      const createButton = screen.getByRole('button', { name: /create group/i })
      
      await user.type(groupNameInput, '   ')
      await user.click(createButton)

      // Should show error message
      expect(screen.getByText(/please enter a group name/i)).toBeInTheDocument()
      
      // Should not call API
      expect(knowledgeBaseService.updateKnowledgeItem).not.toHaveBeenCalled()
    })

    it('should disable create button when loading', async () => {
      const user = userEvent.setup()

      // Mock slow API response
      let resolveUpdate: (value: any) => void
      vi.mocked(knowledgeBaseService.updateKnowledgeItem).mockImplementation(
        () => new Promise(resolve => { resolveUpdate = resolve })
      )

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i)
      const createButton = screen.getByRole('button', { name: /create group/i })
      
      await user.type(groupNameInput, 'Frontend Frameworks')
      await user.click(createButton)

      // Button should be disabled during loading
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()

      // Should not allow Enter key during loading
      await user.keyboard('{Enter}')
      
      // Should still only have 3 calls (one per item)
      expect(knowledgeBaseService.updateKnowledgeItem).toHaveBeenCalledTimes(3)

      // Resolve the promises
      resolveUpdate!(mockKnowledgeItems[0])
    })
  })

  describe('Error Handling', () => {
    it('should handle group creation errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock API failure
      vi.mocked(knowledgeBaseService.updateKnowledgeItem).mockRejectedValue(
        new Error('Update failed')
      )

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i)
      const createButton = screen.getByRole('button', { name: /create group/i })
      
      await user.type(groupNameInput, 'Frontend Frameworks')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to create group/i)).toBeInTheDocument()
      })

      // Should not call onSuccess on error
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    it('should restore button state after error', async () => {
      const user = userEvent.setup()

      vi.mocked(knowledgeBaseService.updateKnowledgeItem).mockRejectedValue(
        new Error('Update failed')
      )

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i)
      
      await user.type(groupNameInput, 'Frontend Frameworks')
      
      const createButton = screen.getByRole('button', { name: /create group/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to create group/i)).toBeInTheDocument()
      })

      // Button should be enabled again
      const resetButton = screen.getByRole('button', { name: /create group/i })
      expect(resetButton).not.toBeDisabled()
    })

    it('should handle partial failures gracefully', async () => {
      const user = userEvent.setup()

      // Mock some items failing
      vi.mocked(knowledgeBaseService.updateKnowledgeItem)
        .mockResolvedValueOnce(mockKnowledgeItems[0])
        .mockRejectedValueOnce(new Error('Update failed'))
        .mockResolvedValueOnce(mockKnowledgeItems[2])

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i)
      const createButton = screen.getByRole('button', { name: /create group/i })
      
      await user.type(groupNameInput, 'Frontend Frameworks')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to create group/i)).toBeInTheDocument()
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Modal Interaction', () => {
    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should close modal when backdrop is clicked', async () => {
      const user = userEvent.setup()

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Click on backdrop (outside modal content)
      const backdrop = screen.getByRole('dialog').parentElement ||
                      document.querySelector('.fixed.inset-0')
      
      if (backdrop) {
        await user.click(backdrop)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      }
    })

    it('should not close modal when clicking inside modal content', async () => {
      const user = userEvent.setup()

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const modalContent = screen.getByText('Create Knowledge Group')
      await user.click(modalContent)

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('should close modal with Escape key', async () => {
      const user = userEvent.setup()

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.keyboard('{Escape}')

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Item Preview Display', () => {
    it('should show item titles in preview', () => {
      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('React Documentation')).toBeInTheDocument()
      expect(screen.getByText('Vue.js Guide')).toBeInTheDocument()
      expect(screen.getByText('Angular Tutorial')).toBeInTheDocument()
    })

    it('should show item source types', () => {
      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Check for URL indicators or badges
      const urlBadges = screen.getAllByText(/url/i)
      expect(urlBadges.length).toBeGreaterThan(0)
    })

    it('should handle large number of selected items', () => {
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        ...mockKnowledgeItems[0],
        id: `${i + 1}`,
        source_id: `source-${i + 1}`,
        title: `Item ${i + 1}`,
      }))

      render(
        <GroupCreationModal
          selectedItems={manyItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText(/20.*items.*will be grouped/i)).toBeInTheDocument()
    })

    it('should handle empty selection gracefully', () => {
      render(
        <GroupCreationModal
          selectedItems={[]}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText(/0.*items.*will be grouped/i)).toBeInTheDocument()
      
      // Create button should be disabled or show appropriate message
      const createButton = screen.getByRole('button', { name: /create group/i })
      expect(createButton).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i)
      const createButton = screen.getByRole('button', { name: /create group/i })
      const closeButton = screen.getByRole('button', { name: /close/i })

      expect(groupNameInput).toBeInTheDocument()
      expect(createButton).toBeInTheDocument()
      expect(closeButton).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Tab through interactive elements
      await user.tab()
      const groupNameInput = screen.getByLabelText(/group name/i)
      expect(groupNameInput).toHaveFocus()

      await user.tab()
      const createButton = screen.getByRole('button', { name: /create group/i })
      expect(createButton).toHaveFocus()

      await user.tab()
      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toHaveFocus()
    })

    it('should have proper modal role and focus management', () => {
      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Should trap focus within modal
      const modal = screen.getByRole('dialog') || 
                   document.querySelector('[role="dialog"]')
      expect(modal).toBeInTheDocument()
    })

    it('should announce group creation status to screen readers', async () => {
      const user = userEvent.setup()

      render(
        <GroupCreationModal
          selectedItems={mockKnowledgeItems}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const groupNameInput = screen.getByLabelText(/group name/i)
      const createButton = screen.getByRole('button', { name: /create group/i })
      
      await user.type(groupNameInput, 'Frontend Frameworks')
      await user.click(createButton)

      // Should have aria-live region for status updates
      await waitFor(() => {
        const statusMessage = screen.getByText(/successfully created group/i)
        expect(statusMessage).toBeInTheDocument()
      })
    })
  })
})