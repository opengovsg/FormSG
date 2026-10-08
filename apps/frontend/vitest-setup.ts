/// <reference types="vitest/globals" />

import '@testing-library/jest-dom/vitest'

import { setProjectAnnotations } from '@storybook/react'

// Storybook's preview file location
import * as globalStorybookConfig from './.storybook/preview'

setProjectAnnotations(globalStorybookConfig)

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(function (this: {
  observe: () => void
  unobserve: () => void
  disconnect: () => void
}) {
  this.observe = vi.fn()
  this.unobserve = vi.fn()
  this.disconnect = vi.fn()
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
