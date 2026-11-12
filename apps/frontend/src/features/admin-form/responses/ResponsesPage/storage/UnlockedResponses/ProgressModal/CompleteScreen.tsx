import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Badge,
  Icon,
  ListItem,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  Text,
  UnorderedList,
  Wrap,
} from '@chakra-ui/react'
import simplur from 'simplur'

import { BxsCheckCircle, BxsXCircle } from '~assets/icons'
import { useIsMobile } from '~hooks/useIsMobile'
import { useMdComponents } from '~hooks/useMdComponents'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { MarkdownText } from '~components/MarkdownText'
import { ModalCloseButton } from '~components/Modal'

import { DownloadResult } from '../../types'
import { getFailedDownloadsSummary } from '../../utils/failedDownloads'

interface CompleteScreenProps {
  isWithAttachments: boolean
  onClose: () => void
  isBeta?: boolean
  downloadMetadata?: DownloadResult
}

export const CompleteScreen = ({
  isWithAttachments,
  onClose,
  downloadMetadata,
  isBeta = true,
}: CompleteScreenProps): JSX.Element => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const mdComponents = useMdComponents()

  const completionMessage = useMemo(() => {
    if (!downloadMetadata) return ''
    const { successCount, expectedCount, failedDownloads } = downloadMetadata
    if (successCount >= expectedCount && !failedDownloads?.length) {
      return `All responses${
        isWithAttachments ? ' and attachments' : ''
      } have been downloaded successfully.`
    }
    // Success count is less than expected count.
    // This means some responses were not downloaded successfully.
    // Show the user the number of responses that were not downloaded.
    // Not inlining conditional since simplur seems to not work with inlined conditionals.
    if (isWithAttachments) {
      return simplur`**${successCount.toLocaleString()}** ${[
        successCount,
      ]}response[|s] and attachment[|s] ha[s|ve] been downloaded successfully, refer to the downloaded CSV file for more details.`
    }
    return simplur`**${successCount.toLocaleString()}** ${[
      successCount,
    ]}response[|s] ha[s|ve] been downloaded successfully, refer to the downloaded CSV file for more details.`
  }, [downloadMetadata, isWithAttachments])

  // What the one zip left out, marked by placeholders in the zip
  const failedDownloadsSummary = useMemo(
    () =>
      downloadMetadata?.failedDownloads?.length
        ? getFailedDownloadsSummary(downloadMetadata.failedDownloads)
        : undefined,
    [downloadMetadata?.failedDownloads],
  )

  const attachmentErrorMessage = useMemo(() => {
    if (!downloadMetadata?.errorCount) return ''

    // Not inlining conditional since simplur seems to not work with inlined conditionals.
    if (isWithAttachments) {
      return simplur`**${downloadMetadata.errorCount}** response[|s] and attachment[|s] could not be downloaded.`
    }

    return simplur`**${downloadMetadata.errorCount}** response[|s] could not be downloaded.`
  }, [downloadMetadata?.errorCount, isWithAttachments])

  return (
    <>
      <ModalCloseButton />
      <ModalHeader color="secondary.700" pr="4.5rem">
        <Wrap shouldWrapChildren direction="row" align="center">
          <Text>
            {t(
              'features.adminForm.responses.responsesPage.storage.unlockedResponses.progressModal.completeScreen.downloadComplete',
            )}
          </Text>
          {isBeta ? (
            <Badge
              w="fit-content"
              colorScheme="primary"
              variant="subtle"
              color="secondary.500"
            >
              {t('features.common.betaBadgeLabel')}
            </Badge>
          ) : null}
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
          {failedDownloadsSummary ? (
            <InlineMessage variant="warning">
              <Stack spacing="0.5rem" minW={0}>
                <Text>{failedDownloadsSummary.message}</Text>
                <UnorderedList styleType="disc" ms="1.25rem" spacing="0.25rem">
                  {failedDownloadsSummary.items.map((item, index) => (
                    <ListItem key={index} wordBreak="break-word">
                      {item}
                    </ListItem>
                  ))}
                </UnorderedList>
              </Stack>
            </InlineMessage>
          ) : null}
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
          {t(
            'features.adminForm.responses.responsesPage.storage.unlockedResponses.progressModal.completeScreen.backToResponses',
          )}
        </Button>
      </ModalFooter>
    </>
  )
}
