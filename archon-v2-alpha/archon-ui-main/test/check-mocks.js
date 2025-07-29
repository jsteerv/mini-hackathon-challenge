import { vi } from 'vitest'

// Check what mocks are registered
console.log('Registered mocks:', Object.keys(vi.getMockedModules || {}))
EOF < /dev/null