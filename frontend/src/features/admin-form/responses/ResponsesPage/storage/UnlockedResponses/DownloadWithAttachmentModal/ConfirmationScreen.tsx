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
  const { t: confirmationScreenTranslation } = useTranslation('translation', {
    keyPrefix:
      'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadWithAttachmentModal.confirmationScreen',
  })
  const { t } = useTranslation()

  const getTitle = () => {
    const { isDownloadCsv, isDownloadAttachments, isDownloadPdf } =
      downloadOptions
    const titleParts = []
    if (isDownloadCsv)
      titleParts.push(confirmationScreenTranslation('responsesText'))
    if (isDownloadAttachments)
      titleParts.push(confirmationScreenTranslation('attachmentsText'))
    if (isDownloadPdf)
      titleParts.push(confirmationScreenTranslation('pdfsText'))

    if (titleParts.length == 0) {
      return ''
    }

    const downloadItems =
      titleParts.length > 2
        ? `${titleParts.slice(0, -1).join(', ')} ${confirmationScreenTranslation('andText')} ${titleParts[titleParts.length - 1]}`
        : titleParts.join(` ${confirmationScreenTranslation('andText')} `)

    return confirmationScreenTranslation('downloadTitle', {
      downloadItems,
    })
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
                t={confirmationScreenTranslation}
                i18nKey={'attachmentsDescription'}
              />
            </Text>
          ) : undefined}
          {downloadOptions.isDownloadPdf ? (
            <Text>
              <Trans
                t={confirmationScreenTranslation}
                i18nKey={'pdfsDescription'}
              />
            </Text>
          ) : undefined}
          <Text>
            <b>{confirmationScreenTranslation('numberOfResponses')}:</b>{' '}
            {responsesCount.toLocaleString()}
            <br />
            <b>{confirmationScreenTranslation('estimatedTime')}:</b>{' '}
            {confirmationScreenTranslation('estimatedTimeReference')}
          </Text>
          <Text>
            {confirmationScreenTranslation('filterResponsesCountHelperText')}
          </Text>
          <InlineMessage>
            <Stack>
              <Text textStyle="subhead-1">
                {confirmationScreenTranslation(
                  'intensiveOperationWarning.title',
                )}
              </Text>
              <List>
                <InlineTextListItem>
                  {confirmationScreenTranslation(
                    'intensiveOperationWarning.doNotUseIE',
                  )}
                </InlineTextListItem>
                <InlineTextListItem>
                  {confirmationScreenTranslation(
                    'intensiveOperationWarning.ensureStrongNetworkConnectivity',
                  )}
                </InlineTextListItem>
                <InlineTextListItem>
                  {confirmationScreenTranslation(
                    'intensiveOperationWarning.ensureEnoughDiskSpace',
                  )}
                </InlineTextListItem>
              </List>
            </Stack>
          </InlineMessage>
          {responsesCount === 0 && (
            <InlineMessage variant="warning">
              {confirmationScreenTranslation('noResponsesInSelectedDateRange')}
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
            {confirmationScreenTranslation('startDownload')}
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
