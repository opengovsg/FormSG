import { act, renderHook } from '@testing-library/react'

import { useGuidedStepReveal } from './useGuidedStepReveal'

const SECTION_COUNT = 3

const renderReveal = ({
  sectionCount = SECTION_COUNT,
  isEnabled = true,
} = {}) => renderHook(() => useGuidedStepReveal({ sectionCount, isEnabled }))

describe('useGuidedStepReveal', () => {
  describe('while a step is being paced', () => {
    it('opens on the first section alone, with it lit', () => {
      const { result } = renderReveal()

      expect(result.current.visibleCount).toBe(1)
      expect(result.current.activeIndex).toBe(0)
      expect(result.current.isOnLastSection).toBe(false)
    })

    it('reveals one more section per advance and lights the new one', () => {
      const { result } = renderReveal()

      act(() => result.current.advance())

      expect(result.current.visibleCount).toBe(2)
      expect(result.current.activeIndex).toBe(1)
    })

    it('stops advancing at the last section', () => {
      const { result } = renderReveal()

      act(() => result.current.advance())
      act(() => result.current.advance())
      act(() => result.current.advance())

      expect(result.current.visibleCount).toBe(SECTION_COUNT)
      expect(result.current.isOnLastSection).toBe(true)
      expect(result.current.activeIndex).toBe(SECTION_COUNT - 1)
    })

    it('un-reveals the section left behind when going back', () => {
      const { result } = renderReveal()

      act(() => result.current.advance())
      act(() => result.current.goBack())

      expect(result.current.visibleCount).toBe(1)
      expect(result.current.activeIndex).toBe(0)
    })

    it('keeps the step name on screen when going back from the first section', () => {
      const { result } = renderReveal()

      act(() => result.current.goBack())

      expect(result.current.visibleCount).toBe(1)
    })
  })

  describe('when the step is not being paced', () => {
    it('shows every section with none lit', () => {
      const { result } = renderReveal({ isEnabled: false })

      expect(result.current.visibleCount).toBe(SECTION_COUNT)
      expect(result.current.activeIndex).toBeNull()
      expect(result.current.isOnLastSection).toBe(true)
    })
  })
})
