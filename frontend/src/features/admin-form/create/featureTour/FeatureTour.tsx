import { useState } from 'react'
import Joyride, { EVENTS, STATUS, status, valueof } from 'react-joyride'
import { useToken } from '@chakra-ui/react'

import { FEATURE_STEPS } from './constants'
import { FeatureTourTooltip } from './FeatureTourTooltip'

interface FeatureTourProps {
  onClose: () => void
}

export const FeatureTour = ({ onClose }: FeatureTourProps): JSX.Element => {
  const [stepIndex, setStepIndex] = useState<number>(0)
  const arrowColor: string = useToken('colors', ['primary.100'])

  const handleJoyrideCallback = ({
    index,
    status,
    type,
  }: {
    index: number
    status: valueof<status>
    type: string
  }) => {
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + 1)
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onClose()
    }
  }

  return (
    <Joyride
      steps={FEATURE_STEPS}
      callback={handleJoyrideCallback}
      stepIndex={stepIndex}
      run
      hideBackButton
      floaterProps={{
        placement: 'right-start',
        styles: {
          arrow: {
            length: 8,
            spread: 16,
          },
          floaterWithAnimation: {
            transition: 'opacity 0.3s ease 0s, transform 0s ease 0s',
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
