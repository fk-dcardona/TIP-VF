/**
 * Test Setup File
 * Configures the testing environment for all tests
 */

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-123',
      emailAddresses: [{ emailAddress: 'test@finkargo.ai' }],
      firstName: 'Test',
      lastName: 'User'
    },
    isLoaded: true,
    isSignedIn: true
  }),
  useOrganization: () => ({
    organization: {
      id: 'test-org-123',
      name: 'Test Organization'
    },
    isLoaded: true
  }),
  useAuth: () => ({
    isSignedIn: true,
    userId: 'test-user-123',
    sessionId: 'test-session-123',
    getToken: vi.fn().mockResolvedValue('test-token')
  }),
  ClerkProvider: ({ children }: any) => children,
  SignIn: () => null,
  SignUp: () => null,
  UserButton: () => null
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({})
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    // Return a mock element without JSX
    return null;
  }
}))

// Global test utilities
global.mockApiResponse = (data: any, options: any = {}) => {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
    headers: new Headers(options.headers ?? {}),
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)], { type: 'application/json' }),
    clone: () => mockApiResponse(data, options),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic' as ResponseType,
    url: options.url ?? 'http://localhost:3000/api/test'
  }
}

// Performance marks
global.performance.mark = vi.fn()
global.performance.measure = vi.fn()

// Console mocks for cleaner test output
const originalError = console.error
console.error = (...args: any[]) => {
  // Filter out expected React errors
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render') ||
     args[0].includes('Warning: `ReactDOMTestUtils.act`'))
  ) {
    return
  }
  originalError.call(console, ...args)
}