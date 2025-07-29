import { vi } from 'vitest'

// Mock useToast hook with all required functions
export const useToast = vi.fn(() => ({
  showToast: vi.fn(),
  toasts: [],
  dismissToast: vi.fn()
}))

// Export the mock for easy access in tests
export const mockShowToast = vi.fn()
export const mockDismissToast = vi.fn()

// Override with commonly used mock implementation
useToast.mockImplementation(() => ({
  showToast: mockShowToast,
  toasts: [],
  dismissToast: mockDismissToast
}))