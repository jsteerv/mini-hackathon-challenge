import { vi } from 'vitest'

// Mock editor instance
const mockEditor = {
  destroy: vi.fn(),
  action: vi.fn(),
  use: vi.fn(),
  config: vi.fn(),
  getMarkdown: vi.fn(() => ''),
  setMarkdown: vi.fn(),
  ctx: {
    get: vi.fn(),
    set: vi.fn()
  }
}

// Mock crepe object with create method
export const crepe = {
  create: vi.fn().mockResolvedValue(mockEditor)
}

// Export additional mocks for testing
export const mockDestroy = mockEditor.destroy
export const mockGetMarkdown = mockEditor.getMarkdown
export const mockSetMarkdown = mockEditor.setMarkdown