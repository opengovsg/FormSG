import { useEffect, useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalOverlay,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { XMotionBox } from '~templates/MotionBox'

import { CanceledResult, DownloadResult } from '../../types'
import { isCanceledResult } from '../../utils/typeguards'

import { CompleteScreen } from './CompleteScreen'
import { ProgressModalContent } from './ProgressModalContent'

export interface ProgressModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  downloadPercentage: number
  children: React.ReactNode
  downloadMetadata?: DownloadResult | CanceledResult
  onCancel: () => void
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
  onClose,
  onCancel,
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
      closeOnEsc={currentStep !== ProgressFlowStates.Progress}
      closeOnOverlayClick={currentStep !== ProgressFlowStates.Progress}
    >
      <ModalOverlay />
      <ModalContent overflow="hidden">
        <XMotionBox keyProp={currentStep} custom={direction}>
          {currentStep === ProgressFlowStates.Progress && (
            <ProgressModalContent
              onCancel={onCancel}
              children={children}
              downloadPercentage={downloadPercentage}
            />
          )}
          {currentStep === ProgressFlowStates.Complete &&
            !isCanceledResult(downloadMetadata) && (
              <CompleteScreen
                isWithAttachments={false}
                downloadMetadata={downloadMetadata}
                onClose={onClose}
              />
            )}
        </XMotionBox>
      </ModalContent>
    </Modal>
  )
}
