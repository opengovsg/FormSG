import { usePrefersReducedMotion } from '@chakra-ui/react'

import { useIsWorkflowBuilderRedesign } from './useIsWorkflowBuilderRedesign'

export interface WorkflowSurfaces {
  cardRadius: string
  stepLabelTextStyle: string
  sectionLabelTextStyle: string
  iconRestColor: string
  iconTransitionDuration: string
  activeCardBg: string
  activeCardBorderWidth: string
  activeCardShadow: string
}

const LEGACY: WorkflowSurfaces = {
  cardRadius: '4px',
  stepLabelTextStyle: 'subhead-3',
  sectionLabelTextStyle: 'subhead-3',
  iconRestColor: 'neutral.500',
  iconTransitionDuration: 'normal',
  activeCardBg: 'white',
  activeCardBorderWidth: '1px',
  activeCardShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
}

const REDESIGN: WorkflowSurfaces = {
  ...LEGACY,
  cardRadius: '8px',
  stepLabelTextStyle: 'subhead-1',
  sectionLabelTextStyle: 'subhead-2',
  iconRestColor: 'secondary.300',
  iconTransitionDuration: 'fast',
  activeCardBg: 'primary.100',
  activeCardBorderWidth: '2px',
  activeCardShadow: 'none',
}

export const useWorkflowSurfaces = (): WorkflowSurfaces => {
  const isRedesign = useIsWorkflowBuilderRedesign()
  const prefersReducedMotion = usePrefersReducedMotion()

  const surfaces = isRedesign ? REDESIGN : LEGACY

  if (prefersReducedMotion) {
    return { ...surfaces, iconTransitionDuration: '0s' }
  }
  return surfaces
}
