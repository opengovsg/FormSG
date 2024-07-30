import { useState } from 'react'
import Joyride, { ACTIONS, CallBackProps, EVENTS, STATUS } from 'react-joyride'
import { useToken } from '@chakra-ui/react'

import { FEATURE_STEPS } from './constants'
import { FeatureTourContext } from './FeatureTourContext'
import { FeatureTourTooltip } from './FeatureTourTooltip'

interface FeatureTourProps {
  onClose: () => void
}

export const FeatureTour = ({ onClose }: FeatureTourProps): JSX.Element => {
  const [stepIndex, setStepIndex] = useState<number>(0)
  const [arrowColor] = useToken('colors', ['primary.100'])
  const [isPaginationClicked, setIsPaginationClicked] = useState(false)

  const handleJoyrideCallback = ({
    index,
    status,
    type,
    action,
  }: CallBackProps) => {
    if (!isPaginationClicked) {
      if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        setStepIndex(index + 1)
      }
      if (
        status === STATUS.FINISHED ||
        status === STATUS.SKIPPED ||
        action === ACTIONS.CLOSE
      ) {
        onClose()
      }
    } else {
      setIsPaginationClicked(false)
    }
  }

  const handlePaginationCallback = (indicatorIdx: number) => {
    setIsPaginationClicked(true)
    setStepIndex(indicatorIdx)
  }

  return (
    <FeatureTourContext.Provider
      value={{
        paginationCallback: handlePaginationCallback,
      }}
    >
      <Joyride
        steps={FEATURE_STEPS}
        callback={handleJoyrideCallback}
        stepIndex={stepIndex}
        continuous
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
    </FeatureTourContext.Provider>
  )
}
