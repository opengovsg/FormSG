import { act, fireEvent, renderHook } from '@testing-library/react'

import { useWorkflowActionPlacement } from './useWorkflowActionPlacement'

const rect = (top: number, bottom: number, left = 0, right = 500): DOMRect => ({
  top,
  bottom,
  left,
  right,
  width: right - left,
  height: bottom - top,
  x: left,
  y: top,
  toJSON: () => ({}),
})

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('useWorkflowActionPlacement DOM measurements', () => {
  it('accounts for the real scroll root and header inset when measuring the full row', () => {
    const root = document.createElement('div')
    const topRow = document.createElement('div')
    let bounds = rect(105, 150)
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(rect(100, 600))
    vi.spyOn(topRow, 'getBoundingClientRect').mockImplementation(() => bounds)
    const { result } = renderHook(() =>
      useWorkflowActionPlacement({
        root,
        headerInset: 20,
        topRow,
        currentRow: null,
        focusedLocation: null,
      }),
    )
    expect(result.current.showStickyActions).toBe(true)
    bounds = rect(120, 165)
    act(() => {
      fireEvent.scroll(root)
    })
    expect(result.current.showStickyActions).toBe(false)
  })
  it('treats horizontal clipping as incomplete visibility after a resize', () => {
    const root = document.createElement('div')
    const topRow = document.createElement('div')
    let bounds = rect(100, 150, 0, 550)
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(rect(80, 600))
    vi.spyOn(topRow, 'getBoundingClientRect').mockImplementation(() => bounds)
    const { result } = renderHook(() =>
      useWorkflowActionPlacement({
        root,
        topRow,
        currentRow: null,
        focusedLocation: null,
      }),
    )
    expect(result.current.showStickyActions).toBe(true)
    bounds = rect(100, 200, 0, 500)
    act(() => {
      fireEvent.resize(window)
    })
    expect(result.current.showStickyActions).toBe(false)
  })
  it('does not treat a display-none current row as visible when Activity is hidden', () => {
    const root = document.createElement('div')
    const topRow = document.createElement('div')
    const currentRow = document.createElement('div')
    let currentBounds = rect(500, 550)
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(rect(80, 600))
    vi.spyOn(topRow, 'getBoundingClientRect').mockReturnValue(rect(-100, -50))
    vi.spyOn(currentRow, 'getBoundingClientRect').mockImplementation(
      () => currentBounds,
    )
    const { result } = renderHook(() =>
      useWorkflowActionPlacement({
        root,
        topRow,
        currentRow,
        focusedLocation: null,
      }),
    )
    expect(result.current.showStickyActions).toBe(false)
    currentBounds = rect(0, 0, 0, 0)
    act(() => {
      fireEvent.resize(window)
    })
    expect(result.current.showStickyActions).toBe(true)
  })
})
