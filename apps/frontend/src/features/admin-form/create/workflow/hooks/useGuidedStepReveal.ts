import { useCallback, useState } from 'react'

export interface UseGuidedStepRevealInput {
  sectionCount: number
  isEnabled: boolean
}

export interface GuidedStepReveal {
  visibleCount: number
  activeIndex: number | null
  isOnLastSection: boolean
  advance: () => void
  goBack: () => void
}

export const useGuidedStepReveal = ({
  sectionCount,
  isEnabled,
}: UseGuidedStepRevealInput): GuidedStepReveal => {
  const [revealedCount, setRevealedCount] = useState(1)

  const advance = useCallback(
    () => setRevealedCount((count) => Math.min(count + 1, sectionCount)),
    [sectionCount],
  )

  const goBack = useCallback(
    () => setRevealedCount((count) => Math.max(count - 1, 1)),
    [],
  )

  const visibleCount = isEnabled
    ? Math.min(revealedCount, sectionCount)
    : sectionCount

  return {
    visibleCount,
    activeIndex: isEnabled ? visibleCount - 1 : null,
    isOnLastSection: visibleCount >= sectionCount,
    advance,
    goBack,
  }
}
