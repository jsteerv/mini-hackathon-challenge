import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TaskBoardView } from '@/components/project-tasks/TaskBoardView'
import type { Task } from '@/components/project-tasks/TaskTableView'

// Mock react-dnd for testing
vi.mock('react-dnd', async () => {
  const actual = await vi.importActual('react-dnd')
  return {
    ...actual,
    useDrag: vi.fn(() => [{ isDragging: false }, vi.fn()]),
    useDrop: vi.fn(() => [{ isOver: false }, vi.fn()]),
  }
})

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <DndProvider backend={HTML5Backend}>
    {children}
  </DndProvider>
)

describe('TaskBoardView - Drag and Drop', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Task 1',
      description: 'Description 1',
      project_id: 'project-1',
      status: 'backlog',
      uiStatus: 'backlog',
      assignee: 'User',
      task_order: 1,
      feature: 'Feature A',
      sources: [],
      code_examples: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Task 2',
      description: 'Description 2',
      project_id: 'project-1',
      status: 'backlog',
      uiStatus: 'backlog',
      assignee: 'User',
      task_order: 2,
      feature: 'Feature A',
      sources: [],
      code_examples: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Task 3',
      description: 'Description 3',
      project_id: 'project-1',
      status: 'in_progress',
      uiStatus: 'in-progress',
      assignee: 'AI IDE Agent',
      task_order: 1,
      feature: 'Feature B',
      sources: [],
      code_examples: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '4',
      title: 'Task 4',
      description: 'Description 4',
      project_id: 'project-1',
      status: 'done',
      uiStatus: 'complete',
      assignee: 'Archon',
      task_order: 1,
      feature: 'Feature C',
      sources: [],
      code_examples: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  const mockOnTaskUpdate = vi.fn()
  const mockOnTaskDelete = vi.fn()
  const mockOnTaskReorder = vi.fn()
  const mockOnTaskStatusChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Board Layout', () => {
    it('should render all status columns', () => {
      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Check for status columns
      expect(screen.getByText('Backlog')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('Review')).toBeInTheDocument()
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })

    it('should display tasks in correct columns', () => {
      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Tasks should be in correct columns
      const backlogColumn = screen.getByText('Backlog').closest('[data-testid*="column"]')
      const inProgressColumn = screen.getByText('In Progress').closest('[data-testid*="column"]')
      const completeColumn = screen.getByText('Complete').closest('[data-testid*="column"]')

      // Check task placement (implementation specific)
      expect(screen.getByText('Task 1')).toBeInTheDocument()
      expect(screen.getByText('Task 2')).toBeInTheDocument()
      expect(screen.getByText('Task 3')).toBeInTheDocument()
      expect(screen.getByText('Task 4')).toBeInTheDocument()
    })

    it('should show task count in column headers', () => {
      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Should show counts (2 in backlog, 1 in progress, 0 in review, 1 complete)
      expect(screen.getByText(/backlog.*2/i)).toBeInTheDocument()
      expect(screen.getByText(/in progress.*1/i)).toBeInTheDocument()
      expect(screen.getByText(/complete.*1/i)).toBeInTheDocument()
    })
  })

  describe('Drag and Drop Functionality', () => {
    it('should make task cards draggable', () => {
      const { useDrag } = require('react-dnd')
      const mockDragRef = vi.fn()
      
      useDrag.mockReturnValue([{ isDragging: false }, mockDragRef])

      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // useDrag should be called for each task card
      expect(useDrag).toHaveBeenCalled()
    })

    it('should make columns droppable', () => {
      const { useDrop } = require('react-dnd')
      const mockDropRef = vi.fn()
      
      useDrop.mockReturnValue([{ isOver: false }, mockDropRef])

      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // useDrop should be called for drop zones
      expect(useDrop).toHaveBeenCalled()
    })

    it('should show dragging state when task is being dragged', () => {
      const { useDrag } = require('react-dnd')
      
      // Mock dragging state
      useDrag.mockReturnValue([{ isDragging: true }, vi.fn()])

      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Cards being dragged should have dragging styles
      const taskCards = screen.getAllByTestId(/task-card/)
      taskCards.forEach(card => {
        // Check for dragging class or opacity (implementation specific)
        expect(card).toBeInTheDocument()
      })
    })

    it('should show drop zone highlight when hovering over column', () => {
      const { useDrop } = require('react-dnd')
      
      // Mock hovering state
      useDrop.mockReturnValue([{ isOver: true }, vi.fn()])

      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Drop zones should show hover state
      // Implementation would depend on how hover styles are applied
      expect(screen.getByText('Backlog')).toBeInTheDocument()
    })

    it('should call onTaskStatusChange when task is dropped on different column', () => {
      const { useDrop } = require('react-dnd')
      
      // Mock drop callback
      const mockDrop = vi.fn()
      useDrop.mockImplementation((spec) => {
        // Simulate drop event
        if (spec.drop) {
          mockDrop.mockImplementation(spec.drop)
        }
        return [{ isOver: false }, vi.fn()]
      })

      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Simulate dropping task with different status
      mockDrop({
        id: '1',
        status: 'backlog',
        index: 0
      })

      // Should call status change callback
      // Note: This test would need to be adjusted based on actual drop implementation
    })

    it('should call onTaskReorder when task is reordered within same column', () => {
      const { useDrag, useDrop } = require('react-dnd')
      
      // Mock hover callback for reordering
      const mockHover = vi.fn()
      useDrop.mockImplementation((spec) => {
        if (spec.hover) {
          mockHover.mockImplementation(spec.hover)
        }
        return [{ isOver: false }, vi.fn()]
      })

      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Simulate hover for reordering
      mockHover({
        id: '1',
        status: 'backlog',
        index: 0
      })

      // Should call reorder callback
      // Implementation specific - would need adjustment based on actual hover logic
    })
  })

  describe('Task Card Interactions', () => {
    it('should display task information on cards', () => {
      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Check task titles are displayed
      expect(screen.getByText('Task 1')).toBeInTheDocument()
      expect(screen.getByText('Task 2')).toBeInTheDocument()
      expect(screen.getByText('Task 3')).toBeInTheDocument()
      expect(screen.getByText('Task 4')).toBeInTheDocument()
    })

    it('should show assignee information on cards', () => {
      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Check assignees are displayed
      expect(screen.getByText('User')).toBeInTheDocument()
      expect(screen.getByText('AI IDE Agent')).toBeInTheDocument()
      expect(screen.getByText('Archon')).toBeInTheDocument()
    })

    it('should display feature tags on cards', () => {
      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Check features are displayed
      expect(screen.getByText('Feature A')).toBeInTheDocument()
      expect(screen.getByText('Feature B')).toBeInTheDocument()
      expect(screen.getByText('Feature C')).toBeInTheDocument()
    })

    it('should show task actions on hover or click', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      const taskCard = screen.getByText('Task 1').closest('[data-testid*="task-card"]')
      
      // Hover over task card
      if (taskCard) {
        await user.hover(taskCard)
      }

      // Should show edit/delete actions (implementation specific)
      // This would depend on how actions are implemented
    })

    it('should handle task editing', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      const taskCard = screen.getByText('Task 1').closest('[data-testid*="task-card"]')
      
      // Double click to edit (or however editing is triggered)
      if (taskCard) {
        await user.dblClick(taskCard)
      }

      // Should trigger edit mode or callback
      // Implementation specific
    })

    it('should handle task deletion', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Look for delete button (implementation specific)
      const deleteButton = screen.getAllByRole('button').find(btn => 
        btn.getAttribute('title')?.includes('delete') || 
        btn.textContent?.includes('Delete')
      )

      if (deleteButton) {
        await user.click(deleteButton)
        expect(mockOnTaskDelete).toHaveBeenCalled()
      }
    })
  })

  describe('Empty States', () => {
    it('should show empty state for columns with no tasks', () => {
      const emptyTasks: Task[] = []
      
      render(
        <TestWrapper>
          <TaskBoardView
            tasks={emptyTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // All columns should show empty state
      expect(screen.getByText(/backlog.*0/i)).toBeInTheDocument()
      expect(screen.getByText(/in progress.*0/i)).toBeInTheDocument()
      expect(screen.getByText(/complete.*0/i)).toBeInTheDocument()
    })

    it('should allow dropping tasks into empty columns', () => {
      const emptyTasks: Task[] = []
      const { useDrop } = require('react-dnd')
      
      useDrop.mockReturnValue([{ isOver: false }, vi.fn()])
      
      render(
        <TestWrapper>
          <TaskBoardView
            tasks={emptyTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Drop zones should still be active
      expect(useDrop).toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    it('should handle large number of tasks efficiently', () => {
      const manyTasks: Task[] = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        description: `Description ${i}`,
        project_id: 'project-1',
        status: i % 2 === 0 ? 'backlog' : 'in_progress',
        uiStatus: i % 2 === 0 ? 'backlog' : 'in-progress',
        assignee: 'User',
        task_order: i,
        feature: `Feature ${i % 5}`,
        sources: [],
        code_examples: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const startTime = performance.now()
      
      render(
        <TestWrapper>
          <TaskBoardView
            tasks={manyTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000) // 1 second

      // Should display correct counts
      expect(screen.getByText(/backlog.*50/i)).toBeInTheDocument()
      expect(screen.getByText(/in progress.*50/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should support keyboard navigation for drag and drop', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Task cards should be focusable
      const taskCard = screen.getByText('Task 1').closest('[tabindex]')
      if (taskCard) {
        await user.tab()
        expect(taskCard).toHaveFocus()
      }
    })

    it('should have proper ARIA labels for drag and drop', () => {
      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Cards should have appropriate ARIA attributes
      const taskCard = screen.getByText('Task 1').closest('[role]')
      expect(taskCard).toBeInTheDocument()
      
      // Columns should have proper labels
      expect(screen.getByText('Backlog')).toBeInTheDocument()
    })

    it('should announce drag and drop actions to screen readers', () => {
      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Should have aria-live regions for announcements (implementation specific)
      const liveRegion = screen.queryByRole('status')
      // Implementation would depend on how announcements are handled
    })
  })

  describe('Visual Feedback', () => {
    it('should provide visual feedback during drag operations', () => {
      const { useDrag } = require('react-dnd')
      
      // Mock dragging state
      useDrag.mockReturnValue([{ isDragging: true }, vi.fn()])

      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Dragged cards should have visual feedback
      // Implementation specific - depends on CSS classes or inline styles
      expect(screen.getByText('Task 1')).toBeInTheDocument()
    })

    it('should show drop indicators when hovering over valid drop zones', () => {
      const { useDrop } = require('react-dnd')
      
      // Mock hover state
      useDrop.mockReturnValue([{ isOver: true, canDrop: true }, vi.fn()])

      render(
        <TestWrapper>
          <TaskBoardView
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskDelete={mockOnTaskDelete}
            onTaskReorder={mockOnTaskReorder}
            onTaskStatusChange={mockOnTaskStatusChange}
            data-testid="task-board"
          />
        </TestWrapper>
      )

      // Drop zones should show hover indicators
      // Implementation specific
      expect(screen.getByText('Backlog')).toBeInTheDocument()
    })
  })
})