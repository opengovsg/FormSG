/// <reference types="vitest/globals" />

import '@testing-library/jest-dom/vitest'

// Mock the ResizeObserver. Vitest 5's vi.fn() requires a real function (not
// an arrow function) to be usable via `new`, since some libraries (e.g.
// react-virtuoso) construct ResizeObserver with `new`.
const ResizeObserverMock = vi.fn(function ResizeObserver() {
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }
})

// Stub the global ResizeObserver
vi.stubGlobal('ResizeObserver', ResizeObserverMock)

// Mock matchMedia calls
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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
