import { useCallback, useEffect, useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { XMotionBox } from '~templates/MotionBox'

import { CanceledResult, DownloadResult } from '../../types'
import { isCanceledResult } from '../../utils/typeguards'
import { CompleteScreen, ProgressModalContent } from '../ProgressModal'

import { CanceledScreen } from './CanceledScreen'
import { ConfirmationScreen } from './ConfirmationScreen'

export interface DownloadWithAttachmentModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  onDownload: () => void
  onCancel: () => void
  isDownloading: boolean
  responsesCount: number
  downloadPercentage: number
  initialState?: [DownloadWithAttachmentFlowStates, number]
  downloadMetadata?: DownloadResult | CanceledResult
}

/** Exported for testing. */
export enum DownloadWithAttachmentFlowStates {
  Confirmation = 'confirmation',
  Progress = 'progress',
  Complete = 'complete',
}

const INITIAL_STEP_STATE: DownloadWithAttachmentModalProps['initialState'] = [
  DownloadWithAttachmentFlowStates.Confirmation,
  -1,
]

export const DownloadWithAttachmentModal = ({
  isOpen,
  onClose,
  onDownload,
  onCancel,
  isDownloading,
  responsesCount,
  downloadPercentage,
  downloadMetadata,
  initialState = INITIAL_STEP_STATE,
}: DownloadWithAttachmentModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  const [[currentStep, direction], setCurrentStep] = useState(initialState)

  useEffect(() => {
    // Reset step whenever modal is closed.
    if (!isOpen) {
      setCurrentStep(INITIAL_STEP_STATE)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && downloadMetadata) {
      setCurrentStep([DownloadWithAttachmentFlowStates.Complete, 1])
    }
  }, [downloadMetadata, isOpen])

  const handleDownload = useCallback(() => {
    setCurrentStep([DownloadWithAttachmentFlowStates.Progress, 1])
    return onDownload()
  }, [onDownload])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      closeOnOverlayClick={
        currentStep !== DownloadWithAttachmentFlowStates.Progress
      }
      closeOnEsc={currentStep !== DownloadWithAttachmentFlowStates.Progress}
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
              onCancel={onCancel}
            >
              <Text mb="1rem">
                Up to <b>{responsesCount.toLocaleString()}</b> files are being
                downloaded into your destination folder. Navigating away from
                this page will stop the download.
              </Text>
            </ProgressModalContent>
          )}
          {currentStep === DownloadWithAttachmentFlowStates.Complete ? (
            isCanceledResult(downloadMetadata) ? (
              <CanceledScreen onClose={onClose} />
            ) : (
              <CompleteScreen
                isWithAttachments
                downloadMetadata={downloadMetadata}
                onClose={onClose}
              />
            )
          ) : null}
        </XMotionBox>
      </ModalContent>
    </Modal>
  )
}
