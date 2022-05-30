import Joyride from 'react-joyride'

import { FEATURE_TOUR } from './constants'
import { FeatureTourTooltip } from './FeatureTourTooltip'

interface FeatureTourProps {
  shouldRun: boolean
}

const featureTourSteps = [
  {
    target: `#${FEATURE_TOUR.FIRST_STEP.id}`,
    title: `${FEATURE_TOUR.FIRST_STEP.title}`,
    content: `${FEATURE_TOUR.FIRST_STEP.content}`,
    disableBeacon: true,
  },
  {
    target: `#${FEATURE_TOUR.SECOND_STEP.id}`,
    title: `${FEATURE_TOUR.SECOND_STEP.title}`,
    content: `${FEATURE_TOUR.SECOND_STEP.content}`,
    disableBeacon: true,
  },
  {
    target: `#${FEATURE_TOUR.THIRD_STEP.id}`,
    title: `${FEATURE_TOUR.THIRD_STEP.title}`,
    content: `${FEATURE_TOUR.THIRD_STEP.content}`,
    disableBeacon: true,
  },
]

export const FeatureTour = ({ shouldRun }: FeatureTourProps): JSX.Element => {
  return (
    <>
      <Joyride
        steps={featureTourSteps}
        run={shouldRun}
        hideBackButton
        floaterProps={{
          placement: 'right',
          styles: {
            arrow: {
              length: 8,
              spread: 16,
            },
          },
        }}
        spotlightPadding={3}
        tooltipComponent={FeatureTourTooltip}
        debug={true}
      />
    </>
  )
}
