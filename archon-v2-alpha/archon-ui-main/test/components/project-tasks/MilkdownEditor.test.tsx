import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderWithProviders } from '../../test-utils'
import { MilkdownEditor } from '@/components/project-tasks/MilkdownEditor'

// Mock dependencies
vi.mock('@/services/websocketService', () => ({
  websocketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    send: vi.fn(),
  }
}))

// Mock the CSS imports
vi.mock('@milkdown/crepe/theme/common/style.css', () => ({}))
vi.mock('@milkdown/crepe/theme/frame.css', () => ({}))
vi.mock('@milkdown/crepe/theme/frame-dark.css', () => ({}))
vi.mock('./MilkdownEditor.css', () => ({}))

describe('MilkdownEditor', () => {
  const mockDocument = {
    id: 'test-doc-1',
    title: 'Test Document',
    content: {
      markdown: '# Test Document\n\nThis is a test.'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render editor with document title', async () => {
    renderWithProviders(
      <MilkdownEditor
        document={mockDocument}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('Test Document')).toBeTruthy()
  })

  it('should show saved status initially', async () => {
    renderWithProviders(
      <MilkdownEditor
        document={mockDocument}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('All changes saved')).toBeTruthy()
  })

  it('should handle markdown content', async () => {
    const docWithMarkdown = {
      ...mockDocument,
      content: {
        markdown: '# Heading\n\n- Item 1\n- Item 2'
      }
    }

    renderWithProviders(
      <MilkdownEditor
        document={docWithMarkdown}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('Test Document')).toBeTruthy()
  })

  it('should handle object content without markdown', async () => {
    const docWithObjectContent = {
      ...mockDocument,
      content: {
        project_overview: {
          description: 'Test project'
        },
        goals: ['Goal 1', 'Goal 2']
      }
    }

    renderWithProviders(
      <MilkdownEditor
        document={docWithObjectContent}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('Test Document')).toBeTruthy()
  })

  it('should handle string content', async () => {
    const docWithStringContent = {
      ...mockDocument,
      content: 'Just a plain string content'
    }

    renderWithProviders(
      <MilkdownEditor
        document={docWithStringContent}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('Test Document')).toBeTruthy()
  })

  it('should handle dark mode', async () => {
    renderWithProviders(
      <MilkdownEditor
        document={mockDocument}
        onSave={mockOnSave}
        isDarkMode={true}
      />
    )

    const editorDiv = screen.getByText('Test Document').closest('.milkdown-editor')
    expect(editorDiv).toBeTruthy()
  })
})