import { useTranslation } from 'react-i18next'
import { BiCheck } from 'react-icons/bi'
import {
  Badge,
  Box,
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

type HowFilesAreSavedKey =
  | 'zipDescription'
  | 'csvDescription'
  | 'attachmentsDescription'
  | 'pdfsDescription'

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
  const isOneZipEnabled = useFeatureIsOn(
    featureFlags.attachmentsMultiUploadAndOneZip,
  )
  const isVersionSwitchShown = isOneZipEnabled && !isCsvOnly
  const isOneZip = useIsOneZipDownload()
  const [, setDownloadVersion] = useResponsesDownloadVersion()
  const isMobile = useIsMobile()
  const { t: confirmationScreenTranslation } = useTranslation('translation', {
    keyPrefix:
      'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadWithAttachmentModal.confirmationScreen',
  })
  const { t } = useTranslation()

  const getHowFilesAreSavedKeys = (): HowFilesAreSavedKey[] => {
    if (isCsvOnly) return []
    if (isOneZip) return ['zipDescription']
    const keys: HowFilesAreSavedKey[] = []
    if (downloadOptions.isDownloadCsv) keys.push('csvDescription')
    if (downloadOptions.isDownloadAttachments)
      keys.push('attachmentsDescription')
    if (downloadOptions.isDownloadPdf) keys.push('pdfsDescription')
    return keys
  }
  const howFilesAreSavedKeys = getHowFilesAreSavedKeys()

  const getDownloadItems = () => {
    const { isDownloadCsv, isDownloadAttachments, isDownloadPdf } =
      downloadOptions
    const items = []
    if (isDownloadCsv) items.push(confirmationScreenTranslation('csvText'))
    if (isDownloadAttachments)
      items.push(confirmationScreenTranslation('attachmentsText'))
    if (isDownloadPdf) items.push(confirmationScreenTranslation('pdfsText'))

    if (items.length == 0) {
      return ''
    }

    const downloadItems =
      items.length > 2
        ? `${items.slice(0, -1).join(', ')}, ${confirmationScreenTranslation('andText')} ${items[items.length - 1]}`
        : items.join(` ${confirmationScreenTranslation('andText')} `)

    return downloadItems.charAt(0).toUpperCase() + downloadItems.slice(1)
  }
  const downloadItems = getDownloadItems()

  return (
    <>
      <ModalCloseButton />
      <ModalHeader color="secondary.700" pr="4.5rem">
        <Wrap shouldWrapChildren direction="row" align="center">
          <Text>{confirmationScreenTranslation('downloadTitle')}</Text>
          {isVersionSwitchShown ? (
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
          ) : null}
          {isCsvOnly ? null : (
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
          {/* Set for the new table, where filters pick every file downloaded, not just the CSV */}
          {isCsvFollowingTable ? (
            <Text>
              {confirmationScreenTranslation('filtersApplyToDownload')}
              {downloadOptions.isDownloadCsv
                ? ` ${confirmationScreenTranslation('csvAppliesTableView')}`
                : null}
            </Text>
          ) : undefined}
          <Box>
            {downloadItems ? (
              <Text>
                <b>{confirmationScreenTranslation('filesToDownload')}:</b>{' '}
                {downloadItems}
              </Text>
            ) : null}
            {howFilesAreSavedKeys.length > 0 ? (
              <Text>
                <b>{confirmationScreenTranslation('howFilesAreSaved')}:</b>{' '}
                {howFilesAreSavedKeys
                  .map((key) => confirmationScreenTranslation(key))
                  .join(' ')}
              </Text>
            ) : null}
            {isResponsesCountHidden ? null : (
              <Text>
                <b>{confirmationScreenTranslation('numberOfResponses')}:</b>{' '}
                {responsesCount.toLocaleString()}
                {isCsvOnly ? null : (
                  <>
                    <br />
                    <b>
                      {confirmationScreenTranslation('estimatedTime')}:
                    </b>{' '}
                    {confirmationScreenTranslation('estimatedTimeReference')}
                  </>
                )}
              </Text>
            )}
          </Box>
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
                    'intensiveOperationWarning.reduceDownloadsWithFilters',
                  )}
                </InlineTextListItem>
                <InlineTextListItem>
                  {confirmationScreenTranslation(
                    'intensiveOperationWarning.ensureInternetAndStorage',
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
