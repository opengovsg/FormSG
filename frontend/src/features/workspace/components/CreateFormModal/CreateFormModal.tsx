import { FC, useEffect, useState } from 'react'
import {
  Box,
  BoxProps,
  Modal,
  ModalContent,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'
import { HTMLMotionProps, motion } from 'framer-motion'

import { Merge } from '~shared/node_modules/type-fest'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { CreateFormDetailsScreen } from './CreateFormDetailsScreen'
import {
  CreateFormFlowStates,
  useCreateFormWizard,
} from './CreateFormWizardContext'

type MotionBoxProps = Merge<BoxProps, HTMLMotionProps<'div'>>
const MotionBox: FC<MotionBoxProps> = motion(Box)

export type CreateFormModalProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
>

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

/**
 * @preconditions Requires CreateFormWizardProvider parent
 */
export const CreateFormModal = ({
  isOpen,
  onClose,
}: CreateFormModalProps): JSX.Element => {
  const {
    formMethods: { reset },
  } = useCreateFormWizard()
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })

  const handleCloseModal = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCloseModal} size={modalSize}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <ModalCloseButton />
        <ScreenContent />
      </ModalContent>
    </Modal>
  )
}

/**
 * Display screen content depending on the current step (with animation).
 */
const ScreenContent = () => {
  const { direction, currentStep, handleBackToDetails } = useCreateFormWizard()
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
      }}
    >
      {currentStep === CreateFormFlowStates.Details && (
        <CreateFormDetailsScreen />
      )}
      {currentStep === CreateFormFlowStates.Landing && (
        <div>
          <Button onClick={handleBackToDetails}>Back</Button>
        </div>
      )}
    </MotionBox>
  )
}
