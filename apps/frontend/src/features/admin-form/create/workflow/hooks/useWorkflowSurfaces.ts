import { usePrefersReducedMotion } from '@chakra-ui/react'

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

const SURFACES: WorkflowSurfaces = {
  cardRadius: '8px',
  stepLabelTextStyle: 'subhead-1',
  sectionLabelTextStyle: 'subhead-2',
  iconRestColor: 'secondary.300',
  iconTransitionDuration: 'fast',
  activeCardBg: 'primary.50',
  activeCardBorderWidth: '2px',
  activeCardShadow: 'none',
}

export const useWorkflowSurfaces = (): WorkflowSurfaces => {
  const prefersReducedMotion = usePrefersReducedMotion()

  if (prefersReducedMotion) {
    return { ...SURFACES, iconTransitionDuration: '0s' }
  }
  return SURFACES
}
