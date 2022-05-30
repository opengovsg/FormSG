import Joyride from 'react-joyride'
import { useToken } from '@chakra-ui/react'

import { FEATURE_STEPS } from './constants'
import { FeatureTourTooltip } from './FeatureTourTooltip'

interface FeatureTourProps {
  shouldRun: boolean
}

export const FeatureTour = ({ shouldRun }: FeatureTourProps): JSX.Element => {
  const arrowColor: string = useToken('colors', ['primary.100'])

  return (
    <Joyride
      steps={FEATURE_STEPS}
      run={shouldRun}
      hideBackButton
      floaterProps={{
        placement: 'right-start',
        styles: {
          arrow: {
            length: 8,
            spread: 16,
          },
        },
      }}
      styles={{
        options: {
          arrowColor: arrowColor,
        },
      }}
      spotlightPadding={3}
      tooltipComponent={FeatureTourTooltip}
    />
  )
}
