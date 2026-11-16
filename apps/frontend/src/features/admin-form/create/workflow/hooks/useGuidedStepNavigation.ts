import { useCallback, useState } from 'react'

export interface UseGuidedStepNavigationInput<Section extends string> {
  sections: readonly [Section, ...Section[]]
  isEnabled: boolean
}

export interface GuidedStepNavigation<Section extends string> {
  activeSection: Section
  isFirstSection: boolean
  isOnLastSection: boolean
  isReached: (section: string) => boolean
  goTo: (section: string) => void
  advance: () => void
  goBack: () => void
}

/** Manual navigation does not overwrite the paused guided position. */
export const useGuidedStepNavigation = <Section extends string>({
  sections,
  isEnabled,
}: UseGuidedStepNavigationInput<Section>): GuidedStepNavigation<Section> => {
  const [progress, setProgress] = useState({
    current: sections[0],
    guided: sections[0],
    reached: sections[0],
  })
  const activeIndex = Math.max(
    0,
    sections.indexOf(isEnabled ? progress.guided : progress.current),
  )
  const activeSection = sections[activeIndex]

  const goTo = useCallback(
    (section: string) => {
      const index = sections.findIndex((candidate) => candidate === section)
      if (index < 0) return
      const next = sections[index]
      setProgress((previous) => ({
        current: next,
        guided: isEnabled ? next : previous.guided,
        reached:
          isEnabled && index > sections.indexOf(previous.reached)
            ? next
            : previous.reached,
      }))
    },
    [sections, isEnabled],
  )
  const isReached = useCallback(
    (section: string) => {
      const index = sections.findIndex((candidate) => candidate === section)
      return (
        index >= 0 && index <= Math.max(0, sections.indexOf(progress.reached))
      )
    },
    [sections, progress.reached],
  )
  const advance = useCallback(() => {
    const next = sections[activeIndex + 1]
    if (next) goTo(next)
  }, [sections, activeIndex, goTo])
  const goBack = useCallback(() => {
    const previous = sections[activeIndex - 1]
    if (previous) goTo(previous)
  }, [sections, activeIndex, goTo])

  return {
    activeSection,
    isFirstSection: activeIndex === 0,
    isOnLastSection: activeIndex === sections.length - 1,
    isReached,
    goTo,
    advance,
    goBack,
  }
}
