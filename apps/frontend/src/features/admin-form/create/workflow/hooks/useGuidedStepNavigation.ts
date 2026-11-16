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

export const useGuidedStepNavigation = <Section extends string>({
  sections,
  isEnabled,
}: UseGuidedStepNavigationInput<Section>): GuidedStepNavigation<Section> => {
  const [progress, setProgress] = useState({
    manualSection: sections[0],
    guidedSection: sections[0],
    furthestGuidedSection: sections[0],
  })
  const activeIndex = Math.max(
    0,
    sections.indexOf(
      isEnabled ? progress.guidedSection : progress.manualSection,
    ),
  )
  const activeSection = sections[activeIndex]

  const goTo = useCallback(
    (section: string) => {
      const index = sections.findIndex((candidate) => candidate === section)
      if (index < 0) return
      const next = sections[index]
      setProgress((previous) => ({
        manualSection: next,
        guidedSection: isEnabled ? next : previous.guidedSection,
        furthestGuidedSection:
          isEnabled && index > sections.indexOf(previous.furthestGuidedSection)
            ? next
            : previous.furthestGuidedSection,
      }))
    },
    [sections, isEnabled],
  )
  const isReached = useCallback(
    (section: string) => {
      const index = sections.findIndex((candidate) => candidate === section)
      return (
        index >= 0 &&
        index <= Math.max(0, sections.indexOf(progress.furthestGuidedSection))
      )
    },
    [sections, progress.furthestGuidedSection],
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
