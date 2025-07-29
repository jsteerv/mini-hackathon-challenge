import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VersionHistoryModal } from '@/components/project-tasks/VersionHistoryModal'
import projectService from '@/services/projectService'

// Mock dependencies
vi.mock('@/services/projectService')
vi.mock('@/contexts/ToastContext')

interface Version {
  id: string;
  version_number: number;
  change_summary: string;
  change_type: string;
  created_by: string;
  created_at: string;
  content: any;
  document_id?: string;
}

describe('VersionHistoryModal - Version Management Features', () => {
  const mockProjectId = 'project-123'
  const mockDocumentId = 'doc-456'
  const mockFieldName = 'docs'

  const mockVersions: Version[] = [
    {
      id: 'version-1',
      version_number: 3,
      change_summary: 'Updated requirements section',
      change_type: 'edit',
      created_by: 'john.doe@example.com',
      created_at: '2024-01-15T10:30:00Z',
      content: [
        {
          id: 'doc-456',
          title: 'Requirements Document',
          content: { overview: 'Updated project overview' }
        }
      ],
      document_id: 'doc-456',
    },
    {
      id: 'version-2',
      version_number: 2,
      change_summary: 'Added technical specifications',
      change_type: 'add',
      created_by: 'jane.smith@example.com',
      created_at: '2024-01-14T14:20:00Z',
      content: [
        {
          id: 'doc-456',
          title: 'Requirements Document',
          content: { specifications: 'Initial tech specs' }
        }
      ],
      document_id: 'doc-456',
    },
    {
      id: 'version-3',
      version_number: 1,
      change_summary: 'Initial document creation',
      change_type: 'create',
      created_by: 'admin@example.com',
      created_at: '2024-01-13T09:00:00Z',
      content: [
        {
          id: 'doc-456',
          title: 'Requirements Document',
          content: { title: 'Initial requirements' }
        }
      ],
      document_id: 'doc-456',
    },
  ]

  const mockCurrentProject = {
    id: mockProjectId,
    title: 'Test Project',
    docs: [
      {
        id: 'doc-456',
        title: 'Current Requirements Document',
        content: { overview: 'Current project overview' }
      }
    ]
  }

  const mockOnClose = vi.fn()
  const mockOnRestore = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock project service methods
    vi.mocked(projectService.getDocumentVersionHistory).mockResolvedValue(mockVersions)
    vi.mocked(projectService.getProject).mockResolvedValue(mockCurrentProject)
    vi.mocked(projectService.getVersionContent).mockResolvedValue({
      content: mockVersions[0].content
    })
    vi.mocked(projectService.restoreDocumentVersion).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Modal Display', () => {
    it('should not render when isOpen is false', () => {
      render(
        <VersionHistoryModal
          isOpen={false}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      expect(screen.queryByText(/version history/i)).not.toBeInTheDocument()
    })

    it('should render modal when isOpen is true', async () => {
      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
          data-testid="version-history-modal"
        />
      )

      expect(screen.getByText(/version history/i)).toBeInTheDocument()
    })

    it('should load version history on open', async () => {
      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(projectService.getDocumentVersionHistory).toHaveBeenCalledWith(
          mockProjectId,
          mockFieldName
        )
        expect(projectService.getProject).toHaveBeenCalledWith(mockProjectId)
      })
    })

    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close modal when escape key is pressed', async () => {
      const user = userEvent.setup()

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await user.keyboard('{Escape}')

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Version List Display', () => {
    it('should display all versions for the document', async () => {
      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
        expect(screen.getByText('Added technical specifications')).toBeInTheDocument()
        expect(screen.getByText('Initial document creation')).toBeInTheDocument()
      })
    })

    it('should display version numbers in descending order', async () => {
      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        const versionNumbers = screen.getAllByText(/version \d+/i)
        expect(versionNumbers[0]).toHaveTextContent('Version 3')
        expect(versionNumbers[1]).toHaveTextContent('Version 2')
        expect(versionNumbers[2]).toHaveTextContent('Version 1')
      })
    })

    it('should display author information', async () => {
      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument()
        expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument()
        expect(screen.getByText('admin@example.com')).toBeInTheDocument()
      })
    })

    it('should display formatted timestamps', async () => {
      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        // Check that timestamps are displayed (format depends on implementation)
        expect(screen.getByText(/jan.*15.*2024/i)).toBeInTheDocument()
        expect(screen.getByText(/jan.*14.*2024/i)).toBeInTheDocument()
        expect(screen.getByText(/jan.*13.*2024/i)).toBeInTheDocument()
      })
    })

    it('should show change type indicators', async () => {
      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        // Check for change type badges or indicators
        expect(screen.getByText(/edit/i)).toBeInTheDocument()
        expect(screen.getByText(/add/i)).toBeInTheDocument()
        expect(screen.getByText(/create/i)).toBeInTheDocument()
      })
    })
  })

  describe('Version Preview', () => {
    it('should preview version content when preview button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
      })

      const previewButton = screen.getAllByRole('button', { name: /preview/i })[0]
      await user.click(previewButton)

      expect(projectService.getVersionContent).toHaveBeenCalledWith(
        mockProjectId,
        3,
        mockFieldName
      )
    })

    it('should display preview content in modal', async () => {
      const user = userEvent.setup()

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
      })

      const previewButton = screen.getAllByRole('button', { name: /preview/i })[0]
      await user.click(previewButton)

      await waitFor(() => {
        // Preview content should be displayed
        expect(screen.getByText('Requirements Document')).toBeInTheDocument()
      })
    })

    it('should support switching between diff and rendered view modes', async () => {
      const user = userEvent.setup()

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
      })

      const previewButton = screen.getAllByRole('button', { name: /preview/i })[0]
      await user.click(previewButton)

      await waitFor(() => {
        // Should have view mode toggles
        expect(screen.getByRole('button', { name: /diff/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /rendered/i })).toBeInTheDocument()
      })

      const renderedButton = screen.getByRole('button', { name: /rendered/i })
      await user.click(renderedButton)

      // Should switch to rendered view
      expect(renderedButton).toHaveClass('active') // or similar active state class
    })

    it('should show differences between versions in diff mode', async () => {
      const user = userEvent.setup()

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
      })

      const previewButton = screen.getAllByRole('button', { name: /preview/i })[0]
      await user.click(previewButton)

      await waitFor(() => {
        // Should show diff view by default
        const diffButton = screen.getByRole('button', { name: /diff/i })
        expect(diffButton).toHaveClass('active') // or similar active state class
      })
    })
  })

  describe('Version Restoration', () => {
    it('should show restore confirmation modal when restore button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
      })

      const restoreButton = screen.getAllByRole('button', { name: /restore/i })[0]
      await user.click(restoreButton)

      expect(screen.getByText(/restore version/i)).toBeInTheDocument()
      expect(screen.getByText(/version 3/i)).toBeInTheDocument()
    })

    it('should cancel restoration when cancel button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
      })

      const restoreButton = screen.getAllByRole('button', { name: /restore/i })[0]
      await user.click(restoreButton)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText(/restore version/i)).not.toBeInTheDocument()
      })
    })

    it('should restore version when confirm button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
      })

      const restoreButton = screen.getAllByRole('button', { name: /restore/i })[0]
      await user.click(restoreButton)

      const confirmButton = screen.getByRole('button', { name: /restore version/i })
      await user.click(confirmButton)

      expect(projectService.restoreDocumentVersion).toHaveBeenCalledWith(
        mockProjectId,
        3,
        mockFieldName
      )
    })

    it('should reload version history after successful restoration', async () => {
      const user = userEvent.setup()

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
      })

      const restoreButton = screen.getAllByRole('button', { name: /restore/i })[0]
      await user.click(restoreButton)

      const confirmButton = screen.getByRole('button', { name: /restore version/i })
      await user.click(confirmButton)

      await waitFor(() => {
        // Should reload version history
        expect(projectService.getDocumentVersionHistory).toHaveBeenCalledTimes(2)
        expect(projectService.getProject).toHaveBeenCalledTimes(2)
      })
    })

    it('should call onRestore callback after successful restoration', async () => {
      const user = userEvent.setup()

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
      })

      const restoreButton = screen.getAllByRole('button', { name: /restore/i })[0]
      await user.click(restoreButton)

      const confirmButton = screen.getByRole('button', { name: /restore version/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockOnRestore).toHaveBeenCalled()
      })
    })

    it('should show loading state during restoration', async () => {
      const user = userEvent.setup()

      // Mock slow restoration
      vi.mocked(projectService.restoreDocumentVersion).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
      })

      const restoreButton = screen.getAllByRole('button', { name: /restore/i })[0]
      await user.click(restoreButton)

      const confirmButton = screen.getByRole('button', { name: /restore version/i })
      await user.click(confirmButton)

      // Should show loading state
      expect(screen.getByText(/restoring/i)).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByText(/restoring/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error when version history fails to load', async () => {
      vi.mocked(projectService.getDocumentVersionHistory).mockRejectedValue(
        new Error('Failed to load versions')
      )

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/failed to load version history/i)).toBeInTheDocument()
      })
    })

    it('should display error when version content fails to load', async () => {
      const user = userEvent.setup()
      
      vi.mocked(projectService.getVersionContent).mockRejectedValue(
        new Error('Failed to load content')
      )

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
      })

      const previewButton = screen.getAllByRole('button', { name: /preview/i })[0]
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to load version content/i)).toBeInTheDocument()
      })
    })

    it('should display error when restoration fails', async () => {
      const user = userEvent.setup()
      
      vi.mocked(projectService.restoreDocumentVersion).mockRejectedValue(
        new Error('Restore failed')
      )

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
      })

      const restoreButton = screen.getAllByRole('button', { name: /restore/i })[0]
      await user.click(restoreButton)

      const confirmButton = screen.getByRole('button', { name: /restore version/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to restore version/i)).toBeInTheDocument()
      })
    })

    it('should show retry option when loading fails', async () => {
      const user = userEvent.setup()
      
      vi.mocked(projectService.getDocumentVersionHistory)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockVersions)

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/failed to load version history/i)).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading spinner while loading versions', async () => {
      vi.mocked(projectService.getDocumentVersionHistory).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockVersions), 100))
      )

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      expect(screen.getByText(/loading/i)).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
      })
    })

    it('should show empty state when no versions exist', async () => {
      vi.mocked(projectService.getDocumentVersionHistory).mockResolvedValue([])

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/no version history/i)).toBeInTheDocument()
      })
    })
  })

  describe('Filtering', () => {
    it('should filter versions by document ID when provided', async () => {
      const allVersions = [
        ...mockVersions,
        {
          id: 'version-4',
          version_number: 4,
          change_summary: 'Different document change',
          change_type: 'edit',
          created_by: 'user@example.com',
          created_at: '2024-01-16T12:00:00Z',
          content: [{ id: 'different-doc', title: 'Different Doc' }],
          document_id: 'different-doc',
        }
      ]

      vi.mocked(projectService.getDocumentVersionHistory).mockResolvedValue(allVersions)

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        // Should only show versions for the specified document
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
        expect(screen.queryByText('Different document change')).not.toBeInTheDocument()
      })
    })

    it('should show all versions when no document ID is provided', async () => {
      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
        expect(screen.getByText('Added technical specifications')).toBeInTheDocument()
        expect(screen.getByText('Initial document creation')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByLabelText(/close/i)).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
      })

      // Should be able to tab through interactive elements
      await user.tab()
      expect(screen.getByRole('button', { name: /close/i })).toHaveFocus()

      await user.tab()
      const firstPreviewButton = screen.getAllByRole('button', { name: /preview/i })[0]
      expect(firstPreviewButton).toHaveFocus()
    })

    it('should trap focus within modal', async () => {
      const user = userEvent.setup()

      render(
        <VersionHistoryModal
          isOpen={true}
          onClose={mockOnClose}
          projectId={mockProjectId}
          documentId={mockDocumentId}
          fieldName={mockFieldName}
          onRestore={mockOnRestore}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Updated requirements section')).toBeInTheDocument()
      })

      // Focus should be trapped within the modal
      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()
    })
  })
})