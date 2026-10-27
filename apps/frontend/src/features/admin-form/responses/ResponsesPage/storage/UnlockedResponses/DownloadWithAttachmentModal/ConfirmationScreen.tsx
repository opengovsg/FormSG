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
import { BasicField } from 'formsg-shared/types/field'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import { DropdownMenuLayerProvider, SingleSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import { ModalCloseButton } from '~components/Modal'

import { useAdminForm } from '~features/admin-form/common/queries'

import { DownloadOptions, isCsvOnlyDownload } from '../../types'

const FOLDER_NAME_FIELD_TYPES: BasicField[] = [
  BasicField.ShortText,
  BasicField.Email,
  BasicField.Nric,
  BasicField.Number,
  BasicField.Mobile,
  BasicField.Dropdown,
  BasicField.Date,
]

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
  onDownloadOptionsChange?: (options: DownloadOptions) => void
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
  onDownloadOptionsChange,
}: ConfirmationScreenProps): JSX.Element => {
  const isCsvOnly = isCsvOnlyDownload(downloadOptions)
  // PROTOTYPE (attachments-v2): one zip, with folders named by a field answer.
  const isOneZip =
    useFeatureIsOn(featureFlags.attachmentsV2) &&
    (downloadOptions.isDownloadAttachments || downloadOptions.isDownloadPdf)
  const { data: adminForm } = useAdminForm()
  const folderNameFieldItems = (adminForm?.form_fields ?? [])
    .filter((field) => FOLDER_NAME_FIELD_TYPES.includes(field.fieldType))
    .map((field) => ({ value: field._id, label: field.title }))
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
          {downloadOptions.isDownloadCsv && isCsvFollowingTable ? (
            <Text>{confirmationScreenTranslation('csvAppliesTableView')}</Text>
          ) : undefined}
          {isOneZip ? (
            <Text>
              Everything downloads as one zip file
              {downloadOptions.isDownloadCsv ? ': the CSV, and' : ' with'}{' '}
              {downloadOptions.isDownloadAttachments
                ? `a folder for each response holding its ${downloadOptions.isDownloadPdf ? 'PDF and attachments' : 'attachments'}.`
                : 'every PDF.'}{' '}
              If you cancel, nothing is saved.
            </Text>
          ) : null}
          {isOneZip && downloadOptions.isDownloadAttachments ? (
            <Stack spacing="0.5rem">
              <FormLabel
                isRequired={false}
                description="Folders are named by this answer, then the Response ID. Blank answers use the Response ID only."
              >
                Name folders by
              </FormLabel>
              <DropdownMenuLayerProvider value="popover">
                <SingleSelect
                  name="folderNameFieldId"
                  placeholder="Response ID only"
                  items={folderNameFieldItems}
                  value={downloadOptions.folderNameFieldId ?? ''}
                  onChange={(fieldId) =>
                    onDownloadOptionsChange?.({
                      ...downloadOptions,
                      folderNameFieldId: fieldId || undefined,
                    })
                  }
                />
              </DropdownMenuLayerProvider>
            </Stack>
          ) : null}
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
