import { useEffect, useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalOverlay,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { XMotionBox } from '~templates/MotionBox'

import { DownloadResult } from '../../types'

import { CompleteScreen } from './CompleteScreen'
import { ProgressModalContent } from './ProgressModalContent'

export interface ProgressModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  downloadPercentage: number
  isDownloading: boolean
  children: React.ReactNode
  downloadMetadata?: DownloadResult
}

enum ProgressFlowStates {
  Progress = 'progress',
  Complete = 'complete',
}

const INITIAL_STEP_STATE: [ProgressFlowStates, 1 | -1] = [
  ProgressFlowStates.Progress,
  -1,
]

export const ProgressModal = ({
  isOpen,
  isDownloading,
  onClose,
  downloadPercentage,
  downloadMetadata,
  children,
}: ProgressModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  const [[currentStep, direction], setCurrentStep] =
    useState(INITIAL_STEP_STATE)

  useEffect(() => {
    // Reset step whenever modal is closed.
    if (!isOpen) {
      setCurrentStep(INITIAL_STEP_STATE)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && downloadMetadata) {
      setCurrentStep([ProgressFlowStates.Complete, 1])
    }
  }, [downloadMetadata, isOpen])

  return (
    <Modal
      size={modalSize}
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={currentStep !== ProgressFlowStates.Progress}
    >
      <ModalOverlay />
      <ModalContent overflow="hidden">
        <XMotionBox keyProp={currentStep} custom={direction}>
          {currentStep === ProgressFlowStates.Progress && (
            <ProgressModalContent
              isDownloading={isDownloading}
              onClose={onClose}
              children={children}
              downloadPercentage={downloadPercentage}
            />
          )}
          {currentStep === ProgressFlowStates.Complete && (
            <CompleteScreen
              downloadMetadata={downloadMetadata}
              onClose={onClose}
            />
          )}
        </XMotionBox>
      </ModalContent>
    </Modal>
  )
}
