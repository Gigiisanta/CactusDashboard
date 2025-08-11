import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

vi.stubGlobal('fetch', vi.fn())

// Jest compatibility layer for existing tests
// Map global jest API to vitest's vi
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).jest = vi as unknown as typeof vi
// Also expose React globally for tests that expect it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).React = React

// Mock next-auth to avoid requiring real SessionProvider
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { name: 'Test User' }, expires: '2099-01-01' }, status: 'authenticated' }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children as any,
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// Mock backend user hook used in Dashboard
vi.mock('@/hooks/useBackendUser', () => ({
  useBackendUser: () => ({ role: 'ADVISOR' }),
}))

// Mock API layers used by services y componentes con funciones explícitas
vi.mock('@/lib/api', () => {
  const apiClient = {
    // clients
    getClients: vi.fn(),
    getClient: vi.fn(),
    createClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn(),
    // auth
    login: vi.fn(),
    register: vi.fn(),
    // investment accounts
    createInvestmentAccount: vi.fn(),
    updateInvestmentAccount: vi.fn(),
    deleteInvestmentAccount: vi.fn(),
    // insurance policies
    createInsurancePolicy: vi.fn(),
    updateInsurancePolicy: vi.fn(),
    deleteInsurancePolicy: vi.fn(),
    // dashboard
    getDashboardSummary: vi.fn(),
    getAumHistory: vi.fn(),
  }
  const apiClientInterceptor = {
    getClient: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({ data: {} }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
    })),
  }
  return { apiClient, apiClientInterceptor }
})

vi.mock('@/lib/apiClient', () => {
  const apiClientInterceptor = {
    getClient: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({ data: {} }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
    })),
  }
  return { apiClientInterceptor }
})

// Mock websocket service
vi.mock('@/services/websocket.service', () => {
  const fn = () => undefined
  const connect = vi.fn(async () => true)
  const disconnect = vi.fn(async () => undefined)
  const isConnected = vi.fn(() => false)
  const getConnectionState = vi.fn(() => 'closed')
  const requestConnectionStats = vi.fn(() => undefined)
  const on = vi.fn()
  const off = vi.fn()
  const send = vi.fn(() => false)
  return {
    websocketService: {
      connect,
      disconnect,
      isConnected,
      getConnectionState,
      requestConnectionStats,
      on,
      off,
      send,
    },
  }
})

// Mock toast library
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), promise: vi.fn() },
}))

// Mock next/navigation y next/link con funciones mockeables
vi.mock('next/navigation', () => {
  const useRouter = vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }))
  const useSearchParams = vi.fn(() => new URLSearchParams())
  const usePathname = vi.fn(() => '/')
  return { useRouter, useSearchParams, usePathname }
})

vi.mock('next/link', () => {
  const Link = ({ children }: any) => children
  return { __esModule: true, default: Link }
})

vi.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    back: vi.fn(),
    events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
    isReady: true,
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('IntersectionObserver', IO as any)
vi.stubGlobal('ResizeObserver', IO as any)

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Silence noisy, expected warnings in tests to keep CI logs clean
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

const silencedSubstrings = [
  // React act warnings during hook state updates in tests
  'Warning: An update to TestComponent inside a test was not wrapped in act',
  // Radix Dialog accessibility guidance shown in isolated unit tests
  '`DialogContent` requires a `DialogTitle`',
  'Missing `Description` or `aria-describedby',
]

function shouldSilenceConsole(args: unknown[]): boolean {
  try {
    // Join all args into a single string for matching
    const text = args
      .map((a) => {
        if (typeof a === 'string') return a
        if (a instanceof Error) return `${a.name}: ${a.message}`
        try {
          return JSON.stringify(a)
        } catch {
          return String(a)
        }
      })
      .join(' ')
    return silencedSubstrings.some((m) => text.includes(m))
  } catch {
    return false
  }
}

console.error = (...args: unknown[]) => {
  if (shouldSilenceConsole(args)) return
  if (process.env.CI_STRICT_LOGS === '1') {
    throw new Error(`Unexpected console.error in tests: ${args.map(String).join(' ')}`)
  }
  return originalConsoleError(...args)
}

console.warn = (...args: unknown[]) => {
  if (shouldSilenceConsole(args)) return
  if (process.env.CI_STRICT_LOGS === '1') {
    throw new Error(`Unexpected console.warn in tests: ${args.map(String).join(' ')}`)
  }
  return originalConsoleWarn(...args)
}


