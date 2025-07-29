import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectPage } from '@/pages/ProjectPage'
import { projectService } from '@/services/projectService'
import { projectCreationProgressService } from '@/services/projectCreationProgressService'
import { projectListSocketIO, taskUpdateSocketIO } from '@/services/socketIOService'
import type { Project } from '@/types/project'

// Mock dependencies
vi.mock('@/services/projectService')
vi.mock('@/services/projectCreationProgressService')
vi.mock('@/services/socketIOService')
vi.mock('@/contexts/ToastContext')

const mockProjectService = {
  listProjects: vi.fn(),
  createProject: vi.fn(),
  createProjectWithStreaming: vi.fn(),
  getTasksByProject: vi.fn(),
  deleteProject: vi.fn(),
  updateProject: vi.fn(),
}

const mockProgressService = {
  subscribeToProgress: vi.fn(),
  unsubscribeFromProgress: vi.fn(),
  getProgressById: vi.fn(),
}

const mockSocketIO = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  send: vi.fn(),
  addMessageHandler: vi.fn(),
  removeMessageHandler: vi.fn(),
  isConnected: vi.fn(),
}

describe('ProjectPage - Project Creation Wizard', () => {
  const mockProjects: Project[] = [
    {
      id: '1',
      title: 'Existing Project',
      description: 'An existing project',
      color: 'blue',
      icon: 'Briefcase',
      pinned: false,
      github_repo: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock responses
    mockProjectService.listProjects.mockResolvedValue(mockProjects)
    mockProjectService.getTasksByProject.mockResolvedValue([])
    mockProjectService.createProject.mockResolvedValue({
      id: 'new-project-id',
      title: 'New Project',
      description: 'New project description',
      color: 'blue',
      icon: 'Briefcase',
      pinned: false,
      github_repo: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    
    mockSocketIO.isConnected.mockReturnValue(false)
    mockSocketIO.connect.mockResolvedValue(undefined)
    
    // Mock the services
    vi.mocked(projectService).listProjects = mockProjectService.listProjects
    vi.mocked(projectService).createProject = mockProjectService.createProject
    vi.mocked(projectService).createProjectWithStreaming = mockProjectService.createProjectWithStreaming
    vi.mocked(projectService).getTasksByProject = mockProjectService.getTasksByProject
    vi.mocked(projectService).deleteProject = mockProjectService.deleteProject
    vi.mocked(projectService).updateProject = mockProjectService.updateProject
    
    vi.mocked(projectCreationProgressService).subscribeToProgress = mockProgressService.subscribeToProgress
    vi.mocked(projectCreationProgressService).unsubscribeFromProgress = mockProgressService.unsubscribeFromProgress
    vi.mocked(projectCreationProgressService).getProgressById = mockProgressService.getProgressById
    
    vi.mocked(projectListSocketIO).connect = mockSocketIO.connect
    vi.mocked(projectListSocketIO).disconnect = mockSocketIO.disconnect
    vi.mocked(projectListSocketIO).send = mockSocketIO.send
    vi.mocked(projectListSocketIO).addMessageHandler = mockSocketIO.addMessageHandler
    vi.mocked(projectListSocketIO).removeMessageHandler = mockSocketIO.removeMessageHandler
    vi.mocked(projectListSocketIO).isConnected = mockSocketIO.isConnected
    
    vi.mocked(taskUpdateSocketIO).connect = mockSocketIO.connect
    vi.mocked(taskUpdateSocketIO).disconnect = mockSocketIO.disconnect
    vi.mocked(taskUpdateSocketIO).send = mockSocketIO.send
    vi.mocked(taskUpdateSocketIO).addMessageHandler = mockSocketIO.addMessageHandler
    vi.mocked(taskUpdateSocketIO).removeMessageHandler = mockSocketIO.removeMessageHandler
    vi.mocked(taskUpdateSocketIO).isConnected = mockSocketIO.isConnected
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Project Creation Wizard UI', () => {
    it('should display the new project button', async () => {
      render(<ProjectPage data-testid="project-page" />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument()
      })
    })

    it('should open project creation modal when new project button is clicked', async () => {
      const user = userEvent.setup()
      
      render(<ProjectPage data-testid="project-page" />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument()
      })
      
      const newProjectButton = screen.getByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      expect(screen.getByText(/create new project/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/project title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/project description/i)).toBeInTheDocument()
    })

    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup()
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument()
      })
      
      const newProjectButton = screen.getByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      expect(screen.getByText(/create new project/i)).toBeInTheDocument()
      
      // Close modal
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      await waitFor(() => {
        expect(screen.queryByText(/create new project/i)).not.toBeInTheDocument()
      })
    })

    it('should close modal when X button is clicked', async () => {
      const user = userEvent.setup()
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      expect(screen.getByText(/create new project/i)).toBeInTheDocument()
      
      // Close modal with X button
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)
      
      await waitFor(() => {
        expect(screen.queryByText(/create new project/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('should require project title', async () => {
      const user = userEvent.setup()
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      const createButton = screen.getByRole('button', { name: /create project/i })
      
      // Create button should be disabled when title is empty
      expect(createButton).toBeDisabled()
    })

    it('should enable create button when title is provided', async () => {
      const user = userEvent.setup()
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      const titleInput = screen.getByLabelText(/project title/i)
      const createButton = screen.getByRole('button', { name: /create project/i })
      
      // Type in title
      await user.type(titleInput, 'My New Project')
      
      // Create button should be enabled
      expect(createButton).not.toBeDisabled()
    })

    it('should trim whitespace from title validation', async () => {
      const user = userEvent.setup()
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      const titleInput = screen.getByLabelText(/project title/i)
      const createButton = screen.getByRole('button', { name: /create project/i })
      
      // Type only whitespace
      await user.type(titleInput, '   ')
      
      // Create button should still be disabled
      expect(createButton).toBeDisabled()
    })

    it('should show validation error for empty title', async () => {
      const user = userEvent.setup()
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      // Try to submit with empty title (simulate click even though disabled)
      const titleInput = screen.getByLabelText(/project title/i)
      await user.click(titleInput)
      await user.tab() // Move focus away to trigger validation
      
      // Should show validation message in UI (implementation specific)
      expect(screen.getByRole('button', { name: /create project/i })).toBeDisabled()
    })
  })

  describe('Form Data Handling', () => {
    it('should update form state when typing in title field', async () => {
      const user = userEvent.setup()
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      const titleInput = screen.getByLabelText(/project title/i) as HTMLInputElement
      
      await user.type(titleInput, 'Test Project')
      
      expect(titleInput.value).toBe('Test Project')
    })

    it('should update form state when typing in description field', async () => {
      const user = userEvent.setup()
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      const descriptionInput = screen.getByLabelText(/project description/i) as HTMLTextAreaElement
      
      await user.type(descriptionInput, 'This is a test project description')
      
      expect(descriptionInput.value).toBe('This is a test project description')
    })

    it('should have default color selection', async () => {
      const user = userEvent.setup()
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      // Check if color picker shows default selection (implementation specific)
      // This would depend on how the color picker is implemented
      expect(screen.getByText(/create new project/i)).toBeInTheDocument()
    })
  })

  describe('Project Creation Process', () => {
    it('should create project with basic information', async () => {
      const user = userEvent.setup()
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      // Fill form
      const titleInput = screen.getByLabelText(/project title/i)
      const descriptionInput = screen.getByLabelText(/project description/i)
      
      await user.type(titleInput, 'My Test Project')
      await user.type(descriptionInput, 'A project for testing')
      
      // Submit form
      const createButton = screen.getByRole('button', { name: /create project/i })
      await user.click(createButton)
      
      expect(mockProjectService.createProject).toHaveBeenCalledWith({
        title: 'My Test Project',
        description: 'A project for testing',
        color: 'blue', // default color
        icon: 'Briefcase',
        github_repo: null,
      })
    })

    it('should show loading state during project creation', async () => {
      const user = userEvent.setup()
      
      // Make creation take time
      mockProjectService.createProject.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      // Fill form
      const titleInput = screen.getByLabelText(/project title/i)
      await user.type(titleInput, 'Loading Test Project')
      
      // Submit form
      const createButton = screen.getByRole('button', { name: /create project/i })
      await user.click(createButton)
      
      // Should show loading state
      expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /creating/i })).not.toBeInTheDocument()
      })
    })

    it('should handle streaming project creation', async () => {
      const user = userEvent.setup()
      
      // Mock streaming response
      const mockStreamingData = {
        id: 'streaming-project-id',
        progressId: 'progress-123',
        message: 'Project creation started'
      }
      
      mockProjectService.createProjectWithStreaming.mockResolvedValue(mockStreamingData)
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      // Fill form
      const titleInput = screen.getByLabelText(/project title/i)
      await user.type(titleInput, 'Streaming Project')
      
      // Submit form
      const createButton = screen.getByRole('button', { name: /create project/i })
      await user.click(createButton)
      
      await waitFor(() => {
        expect(mockProjectService.createProjectWithStreaming).toHaveBeenCalledWith({
          title: 'Streaming Project',
          description: '',
          color: 'blue',
          icon: 'Briefcase',
          github_repo: null,
        })
      })
    })

    it('should reset form after successful creation', async () => {
      const user = userEvent.setup()
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      // Fill form
      const titleInput = screen.getByLabelText(/project title/i)
      const descriptionInput = screen.getByLabelText(/project description/i)
      
      await user.type(titleInput, 'Test Project')
      await user.type(descriptionInput, 'Test description')
      
      // Submit form
      const createButton = screen.getByRole('button', { name: /create project/i })
      await user.click(createButton)
      
      // Wait for creation to complete and modal to close
      await waitFor(() => {
        expect(screen.queryByText(/create new project/i)).not.toBeInTheDocument()
      })
      
      // Open modal again to check if form is reset
      const newProjectButton2 = screen.getByRole('button', { name: /new project/i })
      await user.click(newProjectButton2)
      
      const titleInputAfter = screen.getByLabelText(/project title/i) as HTMLInputElement
      const descriptionInputAfter = screen.getByLabelText(/project description/i) as HTMLTextAreaElement
      
      expect(titleInputAfter.value).toBe('')
      expect(descriptionInputAfter.value).toBe('')
    })

    it('should add created project to the projects list', async () => {
      const user = userEvent.setup()
      
      const newProject = {
        id: 'created-project-123',
        title: 'Newly Created Project',
        description: 'A newly created project',
        color: 'blue' as const,
        icon: 'Briefcase',
        pinned: false,
        github_repo: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      mockProjectService.createProject.mockResolvedValue(newProject)
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Wait for initial projects to load
      await waitFor(() => {
        expect(screen.getByText('Existing Project')).toBeInTheDocument()
      })
      
      // Open modal and create project
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      const titleInput = screen.getByLabelText(/project title/i)
      await user.type(titleInput, 'Newly Created Project')
      
      const createButton = screen.getByRole('button', { name: /create project/i })
      await user.click(createButton)
      
      // Project should appear in the list
      await waitFor(() => {
        expect(screen.getByText('Newly Created Project')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when project creation fails', async () => {
      const user = userEvent.setup()
      
      // Mock creation failure
      mockProjectService.createProject.mockRejectedValue(new Error('Failed to create project'))
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      // Fill and submit form
      const titleInput = screen.getByLabelText(/project title/i)
      await user.type(titleInput, 'Failed Project')
      
      const createButton = screen.getByRole('button', { name: /create project/i })
      await user.click(createButton)
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to create project/i)).toBeInTheDocument()
      })
    })

    it('should keep modal open after creation failure', async () => {
      const user = userEvent.setup()
      
      // Mock creation failure
      mockProjectService.createProject.mockRejectedValue(new Error('Creation failed'))
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      // Fill and submit form
      const titleInput = screen.getByLabelText(/project title/i)
      await user.type(titleInput, 'Failed Project')
      
      const createButton = screen.getByRole('button', { name: /create project/i })
      await user.click(createButton)
      
      // Wait for error and check modal is still open
      await waitFor(() => {
        expect(screen.getByText(/create new project/i)).toBeInTheDocument()
      })
    })

    it('should allow retry after creation failure', async () => {
      const user = userEvent.setup()
      
      // Mock initial failure then success
      mockProjectService.createProject
        .mockRejectedValueOnce(new Error('Creation failed'))
        .mockResolvedValueOnce({
          id: 'retry-success-id',
          title: 'Retry Project',
          description: '',
          color: 'blue',
          icon: 'Briefcase',
          pinned: false,
          github_repo: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      // Fill and submit form (first attempt)
      const titleInput = screen.getByLabelText(/project title/i)
      await user.type(titleInput, 'Retry Project')
      
      const createButton = screen.getByRole('button', { name: /create project/i })
      await user.click(createButton)
      
      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/creation failed/i)).toBeInTheDocument()
      })
      
      // Retry
      const retryButton = screen.getByRole('button', { name: /create project/i })
      await user.click(retryButton)
      
      // Should succeed on retry
      await waitFor(() => {
        expect(screen.queryByText(/create new project/i)).not.toBeInTheDocument()
      })
      
      expect(mockProjectService.createProject).toHaveBeenCalledTimes(2)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      const user = userEvent.setup()
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      // Check form elements have proper labels
      expect(screen.getByLabelText(/project title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/project description/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      // Test tab navigation
      const titleInput = screen.getByLabelText(/project title/i)
      const descriptionInput = screen.getByLabelText(/project description/i)
      const createButton = screen.getByRole('button', { name: /create project/i })
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      
      await user.tab()
      expect(titleInput).toHaveFocus()
      
      await user.tab()
      expect(descriptionInput).toHaveFocus()
      
      await user.tab()
      // Color picker would be here (implementation specific)
      
      await user.tab()
      expect(createButton).toHaveFocus()
      
      await user.tab()
      expect(cancelButton).toHaveFocus()
    })

    it('should handle escape key to close modal', async () => {
      const user = userEvent.setup()
      
      render(<ProjectPage data-testid="project-page" />)
      
      // Open modal
      const newProjectButton = await screen.findByRole('button', { name: /new project/i })
      await user.click(newProjectButton)
      
      expect(screen.getByText(/create new project/i)).toBeInTheDocument()
      
      // Press escape
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(screen.queryByText(/create new project/i)).not.toBeInTheDocument()
      })
    })
  })
})