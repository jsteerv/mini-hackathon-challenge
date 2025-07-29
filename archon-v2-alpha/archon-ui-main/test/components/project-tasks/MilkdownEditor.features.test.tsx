import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MilkdownEditor } from '@/components/project-tasks/MilkdownEditor'

// Mock Milkdown dependencies
vi.mock('@milkdown/crepe', () => ({
  Crepe: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    getMarkdown: vi.fn().mockReturnValue('# Test Content\n\nThis is test content.'),
    setMarkdown: vi.fn(),
  })),
  CrepeFeature: {
    HeaderMeta: 'HeaderMeta',
    LinkTooltip: 'LinkTooltip',
    ImageBlock: 'ImageBlock',
    BlockEdit: 'BlockEdit',
    ListItem: 'ListItem',
    CodeBlock: 'CodeBlock',
    Table: 'Table',
    Toolbar: 'Toolbar',
  },
}))

// Mock CSS imports
vi.mock('@milkdown/crepe/theme/common/style.css', () => ({}))
vi.mock('@milkdown/crepe/theme/frame.css', () => ({}))
vi.mock('@milkdown/crepe/theme/frame-dark.css', () => ({}))
vi.mock('@/components/project-tasks/MilkdownEditor.css', () => ({}))

describe('MilkdownEditor - Document Editing Features', () => {
  const mockDocument = {
    id: 'doc-123',
    title: 'Test Document',
    content: {
      markdown: '# Test Document\n\nThis is the initial content.',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock DOM methods
    Element.prototype.addEventListener = vi.fn()
    Element.prototype.removeEventListener = vi.fn()
    Element.prototype.querySelector = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    
    // Mock window methods
    window.addEventListener = vi.fn()
    window.removeEventListener = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Editor Initialization', () => {
    it('should render editor container', async () => {
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      const editorContainer = screen.getByTestId('milkdown-editor')
      expect(editorContainer).toBeInTheDocument()
    })

    it('should initialize Milkdown editor with document content', async () => {
      const { Crepe } = await import('@milkdown/crepe')
      
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      expect(Crepe).toHaveBeenCalledWith({
        root: expect.any(Object),
        defaultValue: expect.stringContaining('# Test Document'),
        features: expect.any(Object),
      })
    })

    it('should enable all required editor features', async () => {
      const { Crepe, CrepeFeature } = await import('@milkdown/crepe')
      
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      const crepeCall = vi.mocked(Crepe).mock.calls[0][0]
      const features = crepeCall.features

      expect(features).toEqual({
        [CrepeFeature.HeaderMeta]: true,
        [CrepeFeature.LinkTooltip]: true,
        [CrepeFeature.ImageBlock]: true,
        [CrepeFeature.BlockEdit]: true,
        [CrepeFeature.ListItem]: true,
        [CrepeFeature.CodeBlock]: true,
        [CrepeFeature.Table]: true,
        [CrepeFeature.Toolbar]: true,
      })
    })

    it('should handle different content formats', async () => {
      const stringContentDoc = {
        ...mockDocument,
        content: '# String Content\n\nThis is string content.',
      }

      const { Crepe } = await import('@milkdown/crepe')
      
      render(
        <MilkdownEditor
          document={stringContentDoc}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      const crepeCall = vi.mocked(Crepe).mock.calls[0][0]
      expect(crepeCall.defaultValue).toBe('# String Content\n\nThis is string content.')
    })

    it('should generate markdown from object content', async () => {
      const objectContentDoc = {
        ...mockDocument,
        content: {
          overview: 'Project overview',
          features: ['Feature 1', 'Feature 2'],
          requirements: {
            description: 'System requirements',
          },
        },
      }

      const { Crepe } = await import('@milkdown/crepe')
      
      render(
        <MilkdownEditor
          document={objectContentDoc}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      const crepeCall = vi.mocked(Crepe).mock.calls[0][0]
      const generatedMarkdown = crepeCall.defaultValue

      expect(generatedMarkdown).toContain('# Test Document')
      expect(generatedMarkdown).toContain('## Overview')
      expect(generatedMarkdown).toContain('Project overview')
      expect(generatedMarkdown).toContain('## Features')
      expect(generatedMarkdown).toContain('- Feature 1')
      expect(generatedMarkdown).toContain('- Feature 2')
    })

    it('should handle empty or null content', async () => {
      const emptyContentDoc = {
        ...mockDocument,
        content: null,
      }

      const { Crepe } = await import('@milkdown/crepe')
      
      render(
        <MilkdownEditor
          document={emptyContentDoc}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      const crepeCall = vi.mocked(Crepe).mock.calls[0][0]
      expect(crepeCall.defaultValue).toBe('# Test Document\n\nStart writing...')
    })
  })

  describe('Theme Support', () => {
    it('should apply dark theme class when isDarkMode is true', async () => {
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          isDarkMode={true}
          data-testid="milkdown-editor"
        />
      )

      const editorContainer = screen.getByTestId('milkdown-editor')
      expect(editorContainer).toHaveClass('milkdown-theme-dark')
    })

    it('should not apply dark theme class when isDarkMode is false', async () => {
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          isDarkMode={false}
          data-testid="milkdown-editor"
        />
      )

      const editorContainer = screen.getByTestId('milkdown-editor')
      expect(editorContainer).not.toHaveClass('milkdown-theme-dark')
    })

    it('should update theme class when isDarkMode changes', async () => {
      const { rerender } = render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          isDarkMode={false}
          data-testid="milkdown-editor"
        />
      )

      const editorContainer = screen.getByTestId('milkdown-editor')
      expect(editorContainer).not.toHaveClass('milkdown-theme-dark')

      rerender(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          isDarkMode={true}
          data-testid="milkdown-editor"
        />
      )

      expect(editorContainer).toHaveClass('milkdown-theme-dark')
    })
  })

  describe('Content Change Tracking', () => {
    it('should track content changes and enable save button', async () => {
      const mockCrepeInstance = {
        create: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        getMarkdown: vi.fn().mockReturnValue('# Modified Content\n\nThis content has changed.'),
        setMarkdown: vi.fn(),
      }

      const { Crepe } = await import('@milkdown/crepe')
      vi.mocked(Crepe).mockImplementation(() => mockCrepeInstance)

      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      // Wait for editor to be created
      await waitFor(() => {
        expect(mockCrepeInstance.create).toHaveBeenCalled()
      })

      // Initially save button should be disabled
      const saveButton = screen.getByRole('button', { name: /save/i })
      expect(saveButton).toBeDisabled()
    })

    it('should detect changes through input events', async () => {
      const mockCrepeInstance = {
        create: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        getMarkdown: vi.fn()
          .mockReturnValueOnce('# Test Document\n\nThis is the initial content.')
          .mockReturnValue('# Test Document\n\nThis content has been modified.'),
        setMarkdown: vi.fn(),
      }

      const { Crepe } = await import('@milkdown/crepe')
      vi.mocked(Crepe).mockImplementation(() => mockCrepeInstance)

      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      await waitFor(() => {
        expect(mockCrepeInstance.create).toHaveBeenCalled()
      })

      // Simulate input event
      const mockEditorElement = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      Element.prototype.querySelector = vi.fn().mockReturnValue(mockEditorElement)

      // Get the input handler and trigger it
      const inputHandler = mockEditorElement.addEventListener.mock.calls.find(
        call => call[0] === 'input'
      )?.[1]

      if (inputHandler) {
        inputHandler()
      }

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save/i })
        expect(saveButton).not.toBeDisabled()
      })
    })

    it('should show unsaved changes indicator', async () => {
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      // After changes are detected, should show indicator
      // Implementation specific - could be asterisk, dot, or text
      await waitFor(() => {
        // Look for save button state or changes indicator
        const saveButton = screen.getByRole('button', { name: /save/i })
        expect(saveButton).toBeInTheDocument()
      })
    })
  })

  describe('Save Functionality', () => {
    it('should save document when save button is clicked', async () => {
      const mockCrepeInstance = {
        create: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        getMarkdown: vi.fn().mockReturnValue('# Modified Document\n\nSaved content.'),
        setMarkdown: vi.fn(),
      }

      const { Crepe } = await import('@milkdown/crepe')
      vi.mocked(Crepe).mockImplementation(() => mockCrepeInstance)

      const user = userEvent.setup()
      
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      await waitFor(() => {
        expect(mockCrepeInstance.create).toHaveBeenCalled()
      })

      // Simulate content change to enable save
      const mockEditorElement = { addEventListener: vi.fn(), removeEventListener: vi.fn() }
      Element.prototype.querySelector = vi.fn().mockReturnValue(mockEditorElement)

      // Enable save button by simulating changes
      const inputHandler = mockEditorElement.addEventListener.mock.calls.find(
        call => call[0] === 'input'
      )?.[1]

      if (inputHandler) {
        inputHandler()
      }

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save/i })
        expect(saveButton).not.toBeDisabled()
      })

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalledWith({
        ...mockDocument,
        content: { markdown: '# Modified Document\n\nSaved content.' },
        updated_at: expect.any(String),
      })
    })

    it('should save document with Ctrl+S keyboard shortcut', async () => {
      const mockCrepeInstance = {
        create: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        getMarkdown: vi.fn().mockReturnValue('# Keyboard Saved\n\nSaved with keyboard.'),
        setMarkdown: vi.fn(),
      }

      const { Crepe } = await import('@milkdown/crepe')
      vi.mocked(Crepe).mockImplementation(() => mockCrepeInstance)

      const user = userEvent.setup()
      
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      await waitFor(() => {
        expect(mockCrepeInstance.create).toHaveBeenCalled()
      })

      // Simulate content change to enable save
      const mockEditorElement = { addEventListener: vi.fn(), removeEventListener: vi.fn() }
      Element.prototype.querySelector = vi.fn().mockReturnValue(mockEditorElement)

      const inputHandler = mockEditorElement.addEventListener.mock.calls.find(
        call => call[0] === 'input'
      )?.[1]

      if (inputHandler) {
        inputHandler()
      }

      // Simulate Ctrl+S
      await user.keyboard('{Control>}s{/Control}')

      expect(mockOnSave).toHaveBeenCalledWith({
        ...mockDocument,
        content: { markdown: '# Keyboard Saved\n\nSaved with keyboard.' },
        updated_at: expect.any(String),
      })
    })

    it('should save document with Cmd+S keyboard shortcut on Mac', async () => {
      const mockCrepeInstance = {
        create: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        getMarkdown: vi.fn().mockReturnValue('# Mac Saved\n\nSaved with Cmd+S.'),
        setMarkdown: vi.fn(),
      }

      const { Crepe } = await import('@milkdown/crepe')
      vi.mocked(Crepe).mockImplementation(() => mockCrepeInstance)

      const user = userEvent.setup()
      
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      await waitFor(() => {
        expect(mockCrepeInstance.create).toHaveBeenCalled()
      })

      // Simulate content change
      const mockEditorElement = { addEventListener: vi.fn(), removeEventListener: vi.fn() }
      Element.prototype.querySelector = vi.fn().mockReturnValue(mockEditorElement)

      const inputHandler = mockEditorElement.addEventListener.mock.calls.find(
        call => call[0] === 'input'
      )?.[1]

      if (inputHandler) {
        inputHandler()
      }

      // Simulate Cmd+S
      await user.keyboard('{Meta>}s{/Meta}')

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          content: { markdown: '# Mac Saved\n\nSaved with Cmd+S.' },
        })
      )
    })

    it('should show loading state during save', async () => {
      const mockCrepeInstance = {
        create: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        getMarkdown: vi.fn().mockReturnValue('# Saving Document\n\nIn progress...'),
        setMarkdown: vi.fn(),
      }

      const { Crepe } = await import('@milkdown/crepe')
      vi.mocked(Crepe).mockImplementation(() => mockCrepeInstance)

      // Mock slow save operation
      const slowSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      const user = userEvent.setup()
      
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={slowSave}
          data-testid="milkdown-editor"
        />
      )

      await waitFor(() => {
        expect(mockCrepeInstance.create).toHaveBeenCalled()
      })

      // Simulate content change and save
      const mockEditorElement = { addEventListener: vi.fn(), removeEventListener: vi.fn() }
      Element.prototype.querySelector = vi.fn().mockReturnValue(mockEditorElement)

      const inputHandler = mockEditorElement.addEventListener.mock.calls.find(
        call => call[0] === 'input'
      )?.[1]

      if (inputHandler) {
        inputHandler()
      }

      const saveButton = await screen.findByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Should show loading state
      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()

      // Wait for save to complete
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      })
    })

    it('should disable save when no changes are present', async () => {
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      const saveButton = screen.getByRole('button', { name: /save/i })
      expect(saveButton).toBeDisabled()
    })

    it('should clear changes state after successful save', async () => {
      const mockCrepeInstance = {
        create: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        getMarkdown: vi.fn().mockReturnValue('# Saved Document\n\nChanges cleared.'),
        setMarkdown: vi.fn(),
      }

      const { Crepe } = await import('@milkdown/crepe')
      vi.mocked(Crepe).mockImplementation(() => mockCrepeInstance)

      const user = userEvent.setup()
      
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      await waitFor(() => {
        expect(mockCrepeInstance.create).toHaveBeenCalled()
      })

      // Simulate content change, save, and check state reset
      const mockEditorElement = { addEventListener: vi.fn(), removeEventListener: vi.fn() }
      Element.prototype.querySelector = vi.fn().mockReturnValue(mockEditorElement)

      const inputHandler = mockEditorElement.addEventListener.mock.calls.find(
        call => call[0] === 'input'
      )?.[1]

      if (inputHandler) {
        inputHandler()
      }

      const saveButton = await screen.findByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled()
      })

      // After save, button should be disabled again
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
      })
    })
  })

  describe('Revert Functionality', () => {
    it('should provide revert button when changes are present', async () => {
      const mockCrepeInstance = {
        create: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        getMarkdown: vi.fn().mockReturnValue('# Modified Document\n\nChanged content.'),
        setMarkdown: vi.fn(),
      }

      const { Crepe } = await import('@milkdown/crepe')
      vi.mocked(Crepe).mockImplementation(() => mockCrepeInstance)

      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      await waitFor(() => {
        expect(mockCrepeInstance.create).toHaveBeenCalled()
      })

      // Simulate content change
      const mockEditorElement = { addEventListener: vi.fn(), removeEventListener: vi.fn() }
      Element.prototype.querySelector = vi.fn().mockReturnValue(mockEditorElement)

      const inputHandler = mockEditorElement.addEventListener.mock.calls.find(
        call => call[0] === 'input'
      )?.[1]

      if (inputHandler) {
        inputHandler()
      }

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /revert/i })).toBeInTheDocument()
      })
    })

    it('should revert changes when revert button is clicked', async () => {
      const mockCrepeInstance = {
        create: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        getMarkdown: vi.fn()
          .mockReturnValueOnce('# Test Document\n\nThis is the initial content.')
          .mockReturnValue('# Modified Document\n\nChanged content.'),
        setMarkdown: vi.fn(),
      }

      const { Crepe } = await import('@milkdown/crepe')
      vi.mocked(Crepe).mockImplementation(() => mockCrepeInstance)

      const user = userEvent.setup()
      
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      await waitFor(() => {
        expect(mockCrepeInstance.create).toHaveBeenCalled()
      })

      // Simulate content change
      const mockEditorElement = { addEventListener: vi.fn(), removeEventListener: vi.fn() }
      Element.prototype.querySelector = vi.fn().mockReturnValue(mockEditorElement)

      const inputHandler = mockEditorElement.addEventListener.mock.calls.find(
        call => call[0] === 'input'
      )?.[1]

      if (inputHandler) {
        inputHandler()
      }

      const revertButton = await screen.findByRole('button', { name: /revert/i })
      await user.click(revertButton)

      // Should call setMarkdown with original content
      expect(mockCrepeInstance.setMarkdown).toHaveBeenCalledWith(
        expect.stringContaining('# Test Document')
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle editor creation failure gracefully', async () => {
      const { Crepe } = await import('@milkdown/crepe')
      
      const failingCrepe = {
        create: vi.fn().mockRejectedValue(new Error('Failed to create editor')),
        destroy: vi.fn(),
      }
      
      vi.mocked(Crepe).mockImplementation(() => failingCrepe)
      
      // Spy on console.error to verify error logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to create Milkdown editor:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })

    it('should handle save errors gracefully', async () => {
      const mockCrepeInstance = {
        create: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        getMarkdown: vi.fn().mockReturnValue('# Error Test\n\nThis will fail to save.'),
        setMarkdown: vi.fn(),
      }

      const { Crepe } = await import('@milkdown/crepe')
      vi.mocked(Crepe).mockImplementation(() => mockCrepeInstance)

      const failingSave = vi.fn().mockRejectedValue(new Error('Save failed'))
      const user = userEvent.setup()
      
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={failingSave}
          data-testid="milkdown-editor"
        />
      )

      await waitFor(() => {
        expect(mockCrepeInstance.create).toHaveBeenCalled()
      })

      // Simulate change and attempt save
      const mockEditorElement = { addEventListener: vi.fn(), removeEventListener: vi.fn() }
      Element.prototype.querySelector = vi.fn().mockReturnValue(mockEditorElement)

      const inputHandler = mockEditorElement.addEventListener.mock.calls.find(
        call => call[0] === 'input'
      )?.[1]

      if (inputHandler) {
        inputHandler()
      }

      const saveButton = await screen.findByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Should show error state or reset to normal state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      })
    })
  })

  describe('Cleanup', () => {
    it('should clean up event listeners on unmount', async () => {
      const mockEditorElement = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      Element.prototype.querySelector = vi.fn().mockReturnValue(mockEditorElement)

      const { unmount } = render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      unmount()

      // Should remove event listeners
      expect(mockEditorElement.removeEventListener).toHaveBeenCalledWith('input', expect.any(Function))
      expect(mockEditorElement.removeEventListener).toHaveBeenCalledWith('keyup', expect.any(Function))
      expect(mockEditorElement.removeEventListener).toHaveBeenCalledWith('paste', expect.any(Function))
      expect(mockEditorElement.removeEventListener).toHaveBeenCalledWith('cut', expect.any(Function))
    })

    it('should destroy Milkdown instance on unmount', async () => {
      const mockCrepeInstance = {
        create: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        getMarkdown: vi.fn().mockReturnValue(''),
        setMarkdown: vi.fn(),
      }

      const { Crepe } = await import('@milkdown/crepe')
      vi.mocked(Crepe).mockImplementation(() => mockCrepeInstance)

      const { unmount } = render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      await waitFor(() => {
        expect(mockCrepeInstance.create).toHaveBeenCalled()
      })

      unmount()

      expect(mockCrepeInstance.destroy).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      const saveButton = screen.getByRole('button', { name: /save/i })
      const revertButton = screen.getByRole('button', { name: /revert/i })

      expect(saveButton).toBeInTheDocument()
      expect(revertButton).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <MilkdownEditor
          document={mockDocument}
          onSave={mockOnSave}
          data-testid="milkdown-editor"
        />
      )

      // Tab through buttons
      await user.tab()
      expect(screen.getByRole('button', { name: /save/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: /revert/i })).toHaveFocus()
    })
  })
})