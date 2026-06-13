import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDelayedFlag } from './useDelayedFlag'

describe('useDelayedFlag', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stays false while active, until the delay elapses', () => {
    const { result } = renderHook(() => useDelayedFlag(true, 300))

    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe(true)
  })

  it('never flips to true if active clears before the delay (the flicker case)', () => {
    const { result, rerender } = renderHook(
      ({ active }) => useDelayedFlag(active, 300),
      { initialProps: { active: true } },
    )

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe(false)

    // Loading finished before the threshold — the skeleton must never show.
    rerender({ active: false })
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe(false)
  })

  it('resets to false when active clears after having elapsed', () => {
    const { result, rerender } = renderHook(
      ({ active }) => useDelayedFlag(active, 300),
      { initialProps: { active: true } },
    )

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe(true)

    rerender({ active: false })
    expect(result.current).toBe(false)
  })
})
