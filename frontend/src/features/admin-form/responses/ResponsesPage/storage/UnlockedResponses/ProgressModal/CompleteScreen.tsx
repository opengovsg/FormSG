import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Badge,
  Icon,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  Text,
  Wrap,
} from '@chakra-ui/react'

import { BxsCheckCircle, BxsXCircle } from '~assets/icons'
import { useIsMobile } from '~hooks/useIsMobile'
import { useMdComponents } from '~hooks/useMdComponents'
import Button from '~components/Button'
import { MarkdownText } from '~components/MarkdownText'
import { ModalCloseButton } from '~components/Modal'

import { DownloadResult } from '../../types'

interface CompleteScreenProps {
  isWithAttachments: boolean
  onClose: () => void
  downloadMetadata?: DownloadResult
}

export const CompleteScreen = ({
  isWithAttachments,
  onClose,
  downloadMetadata,
}: CompleteScreenProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.responses.responsesPage',
  })
  const isMobile = useIsMobile()
  const mdComponents = useMdComponents()

  const completionMessage = useMemo(() => {
    if (!downloadMetadata) return ''
    const { successCount, expectedCount } = downloadMetadata
    if (successCount >= expectedCount) {
      return isWithAttachments
        ? t('storage.unlockedResponses.progressModal.completeScreen.successMessages.allResponsesWithAttachments')
        : t('storage.unlockedResponses.progressModal.completeScreen.successMessages.allResponses')
    }
    // Success count is less than expected count.
    // This means some responses were not downloaded successfully.
    // Show the user the number of responses that were not downloaded.
    if (isWithAttachments) {
      return t('storage.unlockedResponses.progressModal.completeScreen.successMessages.partialSuccessWithAttachments', {
        successCount: successCount.toLocaleString(),
        count: successCount,
      })
    }
    return t('storage.unlockedResponses.progressModal.completeScreen.successMessages.partialSuccess', {
      successCount: successCount.toLocaleString(),
      count: successCount,
    })
  }, [downloadMetadata, isWithAttachments, t])

  const attachmentErrorMessage = useMemo(() => {
    if (!downloadMetadata?.errorCount) return ''

    if (isWithAttachments) {
      return t('storage.unlockedResponses.progressModal.completeScreen.errorMessages.withAttachments', {
        errorCount: downloadMetadata.errorCount,
        count: downloadMetadata.errorCount,
      })
    }

    return t('storage.unlockedResponses.progressModal.completeScreen.errorMessages.withoutAttachments', {
      errorCount: downloadMetadata.errorCount,
      count: downloadMetadata.errorCount,
    })
  }, [downloadMetadata?.errorCount, isWithAttachments, t])

  return (
    <>
      <ModalCloseButton />
      <ModalHeader color="secondary.700" pr="4.5rem">
        <Wrap shouldWrapChildren direction="row" align="center">
          <Text>
            {t('storage.unlockedResponses.progressModal.completeScreen.downloadComplete')}
          </Text>
          <Badge w="fit-content" colorScheme="success">
            {t('features.common.betaBadgeLabel')}
          </Badge>
        </Wrap>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap" color="secondary.500">
        <Stack spacing="1rem">
          <Stack direction="row" spacing="0.5rem">
            <Icon
              color="success.500"
              fontSize="1.25rem"
              height="1.5rem"
              as={BxsCheckCircle}
              aria-hidden
            />
            <MarkdownText components={mdComponents}>
              {completionMessage}
            </MarkdownText>
          </Stack>
          {attachmentErrorMessage && (
            <Stack direction="row" spacing="0.5rem">
              <Icon
                height="1.5rem"
                color="danger.500"
                fontSize="1.25rem"
                as={BxsXCircle}
                aria-hidden
              />
              <MarkdownText components={mdComponents}>
                {attachmentErrorMessage}
              </MarkdownText>
            </Stack>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button isFullWidth={isMobile} onClick={onClose}>
          {t('storage.unlockedResponses.progressModal.completeScreen.backToResponses')}
        </Button>
      </ModalFooter>
    </>
  )
}
