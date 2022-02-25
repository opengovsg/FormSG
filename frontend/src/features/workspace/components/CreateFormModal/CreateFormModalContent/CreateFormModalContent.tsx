import { FC, useEffect, useState } from 'react'
import { Box, BoxProps } from '@chakra-ui/react'
import { HTMLMotionProps, motion } from 'framer-motion'
import { Merge } from 'type-fest'

import {
  CreateFormFlowStates,
  useCreateFormWizard,
} from '../CreateFormWizardContext'

import { CreateFormDetailsScreen } from './CreateFormDetailsScreen'
import { SaveSecretKeyScreen } from './SaveSecretKeyScreen'

const SCREEN_ANIMATION_VARIANT = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }
  },
  center: {
    x: 0,
    opacity: 1,
  },
}

type MotionBoxProps = Merge<BoxProps, HTMLMotionProps<'div'>>
const MotionBox: FC<MotionBoxProps> = motion(Box)

/**
 * @preconditions Requires CreateFormWizardProvider parent
 * Display screen content depending on the current step (with animation).
 */
export const CreateFormModalContent = () => {
  const { direction, currentStep } = useCreateFormWizard()
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  // So animation does not run on first load.
  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false)
    }
  }, [isFirstLoad])

  return (
    <MotionBox
      key={currentStep}
      custom={direction}
      variants={SCREEN_ANIMATION_VARIANT}
      initial={isFirstLoad ? 'center' : 'enter'}
      animate="center"
      transition={{
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
    >
      {currentStep === CreateFormFlowStates.Details && (
        <CreateFormDetailsScreen />
      )}
      {currentStep === CreateFormFlowStates.Landing && <SaveSecretKeyScreen />}
    </MotionBox>
  )
}
