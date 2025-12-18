import { Trans, useTranslation } from 'react-i18next'
import { BiCheck } from 'react-icons/bi'
import {
  Badge,
  Flex,
  List,
  ListIcon,
  ListItem,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  Text,
  Wrap,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { ModalCloseButton } from '~components/Modal'

import { DownloadOptions } from '../../types'

const InlineTextListItem = ({
  children,
}: {
  children: string
}): JSX.Element => (
  <ListItem display="flex">
    <Flex h="1.5rem" align="center">
      <ListIcon as={BiCheck} />
    </Flex>
    {children}
  </ListItem>
)

interface ConfirmationScreenProps {
  onCancel: () => void
  onDownload: () => void
  isDownloading: boolean
  responsesCount: number
  downloadOptions: DownloadOptions
}

export const ConfirmationScreen = ({
  downloadOptions,
  onCancel,
  isDownloading,
  onDownload,
  responsesCount,
}: ConfirmationScreenProps): JSX.Element => {
  const isMobile = useIsMobile()
  const { t } = useTranslation()

  const confirmationScreenKeyPrefix =
    'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadWithAttachmentModal.confirmationScreen'

  const getTitle = () => {
    if (
      downloadOptions.isDownloadCsv &&
      downloadOptions.isDownloadAttachments &&
      downloadOptions.isDownloadPdf
    ) {
      return t(
        `${confirmationScreenKeyPrefix}.titleResponsesAndAttachmentsAndPdfs`,
      )
    }
    if (
      !downloadOptions.isDownloadCsv &&
      downloadOptions.isDownloadAttachments &&
      downloadOptions.isDownloadPdf
    ) {
      return t(`${confirmationScreenKeyPrefix}.titleAttachmentsAndPdfs`)
    }
    if (
      downloadOptions.isDownloadCsv &&
      !downloadOptions.isDownloadAttachments &&
      downloadOptions.isDownloadPdf
    ) {
      return t(`${confirmationScreenKeyPrefix}.titleResponsesAndPdfs`)
    }
    if (
      downloadOptions.isDownloadCsv &&
      downloadOptions.isDownloadAttachments &&
      !downloadOptions.isDownloadPdf
    ) {
      return t(`${confirmationScreenKeyPrefix}.titleResponsesAndAttachments`)
    }
    if (
      !downloadOptions.isDownloadCsv &&
      !downloadOptions.isDownloadAttachments &&
      downloadOptions.isDownloadPdf
    ) {
      return t(`${confirmationScreenKeyPrefix}.titlePdfsOnly`)
    }
    if (
      !downloadOptions.isDownloadCsv &&
      downloadOptions.isDownloadAttachments &&
      !downloadOptions.isDownloadPdf
    ) {
      return t(`${confirmationScreenKeyPrefix}.titleAttachmentsOnly`)
    }
    return ''
  }

  return (
    <>
      <ModalCloseButton />
      <ModalHeader color="secondary.700" pr="4.5rem">
        <Wrap shouldWrapChildren direction="row" align="center">
          <Text>{getTitle()}</Text>
          <Badge w="fit-content" colorScheme="success">
            {t('features.common.betaBadgeLabel')}
          </Badge>
        </Wrap>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap" color="secondary.500">
        <Stack spacing="1rem">
          {downloadOptions.isDownloadAttachments ? (
            <Text>
              <Trans
                i18nKey={`${confirmationScreenKeyPrefix}.attachmentsDescription`}
              />
            </Text>
          ) : undefined}
          {downloadOptions.isDownloadPdf ? (
            <Text>
              <Trans
                i18nKey={`${confirmationScreenKeyPrefix}.pdfsDescription`}
              />
            </Text>
          ) : undefined}
          <Text>
            <b>{t(`${confirmationScreenKeyPrefix}.numberOfResponses`)}:</b>{' '}
            {responsesCount.toLocaleString()}
            <br />
            <b>{t(`${confirmationScreenKeyPrefix}.estimatedTime`)}:</b>{' '}
            {t(`${confirmationScreenKeyPrefix}.estimatedTimeReference`)}
          </Text>
          <Text>
            {t(`${confirmationScreenKeyPrefix}.filterResponsesCountHelperText`)}
          </Text>
          <InlineMessage>
            <Stack>
              <Text textStyle="subhead-1">
                {t(
                  `${confirmationScreenKeyPrefix}.intensiveOperationWarning.title`,
                )}
              </Text>
              <List>
                <InlineTextListItem>
                  {t(
                    `${confirmationScreenKeyPrefix}.intensiveOperationWarning.doNotUseIE`,
                  )}
                </InlineTextListItem>
                <InlineTextListItem>
                  {t(
                    `${confirmationScreenKeyPrefix}.intensiveOperationWarning.ensureStrongNetworkConnectivity`,
                  )}
                </InlineTextListItem>
                <InlineTextListItem>
                  {t(
                    `${confirmationScreenKeyPrefix}.intensiveOperationWarning.ensureEnoughDiskSpace`,
                  )}
                </InlineTextListItem>
              </List>
            </Stack>
          </InlineMessage>
          {responsesCount === 0 && (
            <InlineMessage variant="warning">
              {t(
                `${confirmationScreenKeyPrefix}.noResponsesInSelectedDateRange`,
              )}
            </InlineMessage>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Stack
          direction={{ base: 'column', md: 'row-reverse' }}
          w="100%"
          justify="end"
        >
          <Button
            isFullWidth={isMobile}
            onClick={onDownload}
            isLoading={isDownloading}
            isDisabled={responsesCount === 0}
          >
            {t(`${confirmationScreenKeyPrefix}.startDownload`)}
          </Button>
          <Button
            isFullWidth={isMobile}
            variant="clear"
            colorScheme="secondary"
            onClick={onCancel}
            isDisabled={isDownloading}
          >
            {t('features.common.cancel')}
          </Button>
        </Stack>
      </ModalFooter>
    </>
  )
}
