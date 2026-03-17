import { Step } from 'react-joyride'

import i18n from '~/i18n/i18n'

interface FeatureTourStepAttributes {
  id: string
  stepIndex: number
}

export const FEATURE_TOUR_IDS: FeatureTourStepAttributes[] = [
  {
    id: 'feature_tour_first_step',
    stepIndex: 0,
  },
  {
    id: 'feature_tour_second_step',
    stepIndex: 1,
  },
  {
    id: 'feature_tour_third_step',
    stepIndex: 2,
  },
  {
    id: 'feature_tour_fourth_step',
    stepIndex: 3,
  },
]

export const getFeatureSteps = (): Step[] => {
  return FEATURE_TOUR_IDS.map(({ id, stepIndex }) => {
    return {
      target: `#${id}`,
      title: i18n.t(
        `features.adminForm.featureTour.steps.${stepIndex}.title`,
      ) as string,
      content: i18n.t(
        `features.adminForm.featureTour.steps.${stepIndex}.content`,
      ) as string,
      disableBeacon: true,
    }
  })
}

export const FEATURE_STEPS_COUNT = FEATURE_TOUR_IDS.length
