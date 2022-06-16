import { useCallback, useEffect, useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { XMotionBox } from '~templates/MotionBox'

import { ProgressModalContent } from '../ProgressModal'

import { ConfirmationScreen } from './ConfirmationScreen'

export interface DownloadWithAttachmentModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  onDownload: () => void
  onCancel: () => void
  isDownloading: boolean
  responsesCount: number
  downloadPercentage: number
}

export enum DownloadWithAttachmentFlowStates {
  Confirmation = 'confirmation',
  Progress = 'progress',
  Complete = 'complete',
}

const INITIAL_STEP_STATE: [DownloadWithAttachmentFlowStates, number] = [
  DownloadWithAttachmentFlowStates.Confirmation,
  0 | 1 | -1,
]

export const DownloadWithAttachmentModal = ({
  isOpen,
  onClose,
  onDownload,
  onCancel,
  isDownloading,
  responsesCount,
  downloadPercentage,
}: DownloadWithAttachmentModalProps): JSX.Element => {
  const [[currentStep, direction], setCurrentStep] =
    useState(INITIAL_STEP_STATE)

  useEffect(() => {
    // Reset step whenever modal is closed.
    if (!isOpen) {
      setCurrentStep(INITIAL_STEP_STATE)
    }
  }, [isOpen])

  const handleDownload = useCallback(() => {
    setCurrentStep([DownloadWithAttachmentFlowStates.Progress, 1])
    return onDownload()
  }, [onDownload])

  const handleCancel = useCallback(() => {
    // TODO: Move to conclusion page.
    setCurrentStep([DownloadWithAttachmentFlowStates.Confirmation, 1])
    return onCancel()
  }, [onCancel])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={
        currentStep !== DownloadWithAttachmentFlowStates.Progress
      }
    >
      <ModalOverlay />
      <ModalContent overflow="hidden">
        <XMotionBox keyProp={currentStep} custom={direction}>
          {currentStep === DownloadWithAttachmentFlowStates.Confirmation && (
            <ConfirmationScreen
              isDownloading={isDownloading}
              responsesCount={responsesCount}
              onCancel={onClose}
              onDownload={handleDownload}
            />
          )}
          {currentStep === DownloadWithAttachmentFlowStates.Progress && (
            <ProgressModalContent
              downloadPercentage={downloadPercentage}
              isDownloading={isDownloading}
              onClose={handleCancel}
            >
              <Text mb="1rem">
                Up to <b>{responsesCount.toLocaleString()}</b> files are being
                downloaded into your destination folder. Navigating away from
                this page will stop the download.
              </Text>
            </ProgressModalContent>
          )}
        </XMotionBox>
      </ModalContent>
    </Modal>
  )
}
