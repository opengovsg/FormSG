import { act, renderHook } from '@testing-library/react'

import { useGuidedStepNavigation } from './useGuidedStepNavigation'

const sections = ['name', 'people', 'login', 'fields', 'approvals'] as const

describe('useGuidedStepNavigation', () => {
  it('starts at the first decision', () => {
    const { result } = renderHook(() =>
      useGuidedStepNavigation({ sections, isEnabled: true }),
    )
    expect(result.current.activeSection).toBe('name')
    expect(result.current.isFirstSection).toBe(true)
    expect(result.current.isReached('people')).toBe(false)
  })

  it('keeps reached decisions unlocked when moving backwards', () => {
    const { result } = renderHook(() =>
      useGuidedStepNavigation({ sections, isEnabled: true }),
    )
    act(() => result.current.goTo('fields'))
    act(() => result.current.goBack())
    expect(result.current.activeSection).toBe('login')
    expect(result.current.isReached('fields')).toBe(true)
    expect(result.current.isReached('approvals')).toBe(false)
  })

  it('ignores unknown decisions', () => {
    const { result } = renderHook(() =>
      useGuidedStepNavigation({ sections, isEnabled: true }),
    )
    act(() => result.current.goTo('login'))
    act(() => result.current.goTo('missing'))
    expect(result.current.activeSection).toBe('login')
    expect(result.current.isReached('missing')).toBe(false)
  })

  it('stops at the first and last decisions', () => {
    const { result } = renderHook(() =>
      useGuidedStepNavigation({ sections, isEnabled: true }),
    )
    act(() => result.current.goBack())
    expect(result.current.activeSection).toBe('name')
    act(() => result.current.goTo('approvals'))
    act(() => result.current.advance())
    expect(result.current.activeSection).toBe('approvals')
    expect(result.current.isOnLastSection).toBe(true)
  })

  it('returns to the first decision if eligibility removes the current one', () => {
    const { result, rerender } = renderHook(
      ({ steps }) =>
        useGuidedStepNavigation({ sections: steps, isEnabled: true }),
      {
        initialProps: { steps: sections as readonly [string, ...string[]] },
      },
    )
    act(() => result.current.goTo('login'))
    rerender({ steps: ['name', 'people', 'fields', 'approvals'] })
    expect(result.current.activeSection).toBe('name')
    expect(result.current.isReached('name')).toBe(true)
    act(() => result.current.advance())
    expect(result.current.activeSection).toBe('people')
  })

  it('resumes the guided decision after manual navigation while paused', () => {
    const { result, rerender } = renderHook(
      ({ isEnabled }) => useGuidedStepNavigation({ sections, isEnabled }),
      { initialProps: { isEnabled: true } },
    )
    act(() => result.current.goTo('fields'))
    rerender({ isEnabled: false })
    expect(result.current.activeSection).toBe('fields')
    act(() => result.current.goTo('login'))
    expect(result.current.activeSection).toBe('login')
    rerender({ isEnabled: true })
    expect(result.current.activeSection).toBe('fields')
    expect(result.current.isReached('approvals')).toBe(false)
  })
})
