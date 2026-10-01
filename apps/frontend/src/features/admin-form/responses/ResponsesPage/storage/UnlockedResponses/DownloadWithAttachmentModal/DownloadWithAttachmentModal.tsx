import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { responsesPageNs } from '~/i18n/locales/features/admin-form/responses/responses-page'

import { XMotionBox } from '~templates/MotionBox'

import {
  CanceledResult,
  DownloadOptions,
  DownloadResult,
  isCsvOnlyDownload,
} from '../../types'
import { isCanceledResult } from '../../utils/typeguards'
import { CompleteScreen, ProgressModalContent } from '../ProgressModal'

import { CanceledScreen } from './CanceledScreen'
import { ConfirmationScreen } from './ConfirmationScreen'

export interface DownloadWithAttachmentModalProps extends Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
> {
  onDownload: () => void
  onCancel: () => void
  isDownloading: boolean
  responsesCount: number
  downloadPercentage: number
  initialState?: [DownloadWithAttachmentFlowStates, number]
  downloadMetadata?: DownloadResult | CanceledResult
  downloadOptions: DownloadOptions
  isCsvFollowingTable?: boolean
  isResponsesCountHidden?: boolean
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
  downloadOptions,
  isCsvFollowingTable,
  isResponsesCountHidden,
  initialState = INITIAL_STEP_STATE,
}: DownloadWithAttachmentModalProps): JSX.Element => {
  const [startedOptions, setStartedOptions] = useState(downloadOptions)
  const isCsvOnly = isCsvOnlyDownload(startedOptions)
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
    setStartedOptions(downloadOptions)
    setCurrentStep([DownloadWithAttachmentFlowStates.Progress, 1])
    return onDownload()
  }, [downloadOptions, onDownload])

  const { t } = useTranslation(responsesPageNs)

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
              downloadOptions={downloadOptions}
              isCsvFollowingTable={isCsvFollowingTable}
              isResponsesCountHidden={isResponsesCountHidden}
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
                {isCsvOnly
                  ? t(
                      'storage.unlockedResponses.downloadButton.progressModalContent',
                    )
                  : t(
                      'storage.unlockedResponses.downloadWithAttachmentModal.modal.progressMessage',
                      {
                        responsesCount: (
                          <b>{responsesCount.toLocaleString()}</b>
                        ),
                      },
                    )}
              </Text>
            </ProgressModalContent>
          )}
          {currentStep === DownloadWithAttachmentFlowStates.Complete ? (
            isCanceledResult(downloadMetadata) ? (
              <CanceledScreen onClose={onClose} isBeta={!isCsvOnly} />
            ) : (
              <CompleteScreen
                isWithAttachments={startedOptions.isDownloadAttachments}
                isBeta={!isCsvOnly}
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
