import { vi } from 'vitest'
import React from 'react'

// Mock functions that can be used in tests
export const mockShowToast = vi.fn()
export const mockDismissToast = vi.fn()

// Toast context mock configuration
export const toastContextMock = {
  useToast: () => ({
    showToast: mockShowToast,
    toasts: [],
    dismissToast: mockDismissToast
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children
}