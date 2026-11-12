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
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { ModalCloseButton } from '~components/Modal'
import { Switch } from '~components/Toggle/Switch'

import {
  V1Icon,
  V2Icon,
} from '~features/admin-form/responses/components/versionIcons'
import {
  useIsOneZipDownload,
  useResponsesDownloadVersion,
} from '~features/admin-form/responses/hooks'

import { DownloadOptions, isCsvOnlyDownload } from '../../types'

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
  isCsvFollowingTable?: boolean
  isResponsesCountHidden?: boolean
}

export const ConfirmationScreen = ({
  downloadOptions,
  onCancel,
  isDownloading,
  onDownload,
  responsesCount,
  isCsvFollowingTable,
  isResponsesCountHidden,
}: ConfirmationScreenProps): JSX.Element => {
  const isCsvOnly = isCsvOnlyDownload(downloadOptions)
  const isAttachmentsV2Enabled = useFeatureIsOn(featureFlags.attachmentsV2)
  // The switch carries the Beta badge when it shows, so the title doesn't
  const isVersionSwitchShown = isAttachmentsV2Enabled && !isCsvOnly
  const isOneZip = useIsOneZipDownload()
  const [, setDownloadVersion] = useResponsesDownloadVersion()
  const isMobile = useIsMobile()
  const { t: confirmationScreenTranslation } = useTranslation('translation', {
    keyPrefix:
      'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadWithAttachmentModal.confirmationScreen',
  })
  const { t } = useTranslation()

  const getTitle = () => {
    if (isCsvOnly) return confirmationScreenTranslation('csvTitle')
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
          {isCsvOnly || isVersionSwitchShown ? null : (
            <Badge
              w="fit-content"
              colorScheme="primary"
              variant="subtle"
              color="secondary.500"
            >
              {t('features.common.betaBadgeLabel')}
            </Badge>
          )}
        </Wrap>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap" color="secondary.500">
        <Stack spacing="1rem">
          {downloadOptions.isDownloadCsv && isCsvFollowingTable ? (
            <Text>{confirmationScreenTranslation('csvAppliesTableView')}</Text>
          ) : undefined}
          {isVersionSwitchShown ? (
            <Flex align="center" gap="0.5rem">
              <Text textStyle="subhead-1" color="secondary.700">
                {confirmationScreenTranslation('downloadVersionLabel')}
              </Text>
              <Flex lineHeight={0}>
                <Switch
                  isChecked={isOneZip}
                  onChange={(event) =>
                    setDownloadVersion(event.target.checked ? 'v2' : 'v1')
                  }
                  checkedIcon={V2Icon}
                  uncheckedIcon={V1Icon}
                  aria-label={confirmationScreenTranslation(
                    'downloadVersionLabel',
                  )}
                />
              </Flex>
              <Badge
                colorScheme="primary"
                variant="subtle"
                color="secondary.500"
              >
                {t('features.common.betaBadgeLabel')}
              </Badge>
            </Flex>
          ) : undefined}
          {isOneZip && !isCsvOnly ? (
            <Text>
              <Trans
                t={confirmationScreenTranslation}
                i18nKey={'zipDescription'}
              />
            </Text>
          ) : undefined}
          {!isOneZip && downloadOptions.isDownloadAttachments ? (
            <Text>
              <Trans
                t={confirmationScreenTranslation}
                i18nKey={'attachmentsDescription'}
              />
            </Text>
          ) : undefined}
          {!isOneZip && downloadOptions.isDownloadPdf ? (
            <Text>
              <Trans
                t={confirmationScreenTranslation}
                i18nKey={'pdfsDescription'}
              />
            </Text>
          ) : undefined}
          {isResponsesCountHidden ? null : (
            <Text>
              <b>{confirmationScreenTranslation('numberOfResponses')}:</b>{' '}
              {responsesCount.toLocaleString()}
              {isCsvOnly ? null : (
                <>
                  <br />
                  <b>{confirmationScreenTranslation('estimatedTime')}:</b>{' '}
                  {confirmationScreenTranslation('estimatedTimeReference')}
                </>
              )}
            </Text>
          )}
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
