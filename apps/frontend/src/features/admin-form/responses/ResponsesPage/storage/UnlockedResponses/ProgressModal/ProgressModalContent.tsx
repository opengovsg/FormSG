import { useTranslation } from 'react-i18next'
import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  Progress,
  Text,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

import { ProgressModalProps } from './ProgressModal'

type ProgressModalContentProps = Pick<
  ProgressModalProps,
  'children' | 'downloadPercentage' | 'onCancel'
>

export const ProgressModalContent = ({
  children,
  downloadPercentage,
  onCancel,
}: ProgressModalContentProps): JSX.Element => {
  const isMobile = useIsMobile()
  const { t } = useTranslation()

  return (
    <>
      <ModalHeader color="secondary.700">
        {t(
          'features.adminForm.responses.responsesPage.storage.unlockedResponses.progressModal.content.title',
        )}
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap" color="secondary.500" textStyle="body-2">
        {children}
        <Text textStyle="subhead-1" mb="0.5rem">
          {downloadPercentage}
          {t(
            'features.adminForm.responses.responsesPage.storage.unlockedResponses.progressModal.content.percentCompleted',
          )}
        </Text>
        <Progress size="xl" value={downloadPercentage} hasStripe isAnimated />
      </ModalBody>
      <ModalFooter>
        <Button colorScheme="danger" onClick={onCancel} isFullWidth={isMobile}>
          {t(
            'features.adminForm.responses.responsesPage.storage.unlockedResponses.progressModal.content.stopDownload',
          )}
        </Button>
      </ModalFooter>
    </>
  )
}
