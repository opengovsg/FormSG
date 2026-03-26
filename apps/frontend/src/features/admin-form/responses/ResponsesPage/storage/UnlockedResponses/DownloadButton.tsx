import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useThrottle } from 'react-use'
import {
  Box,
  CheckboxGroup,
  Flex,
  MenuButton,
  MenuList,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import { datadogLogs } from '@datadog/browser-logs'
import simplur from 'simplur'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import { useToast } from '~hooks/useToast'
import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import Menu from '~components/Menu'
import { NavigationPrompt } from '~templates/NavigationPrompt'

import { useStorageResponsesContext } from '../StorageResponsesContext'
import { CanceledResult, DownloadOptions, DownloadResult } from '../types'
import useDecryptionWorkers from '../useDecryptionWorkers'

import { DownloadWithAttachmentModal } from './DownloadWithAttachmentModal'
import { ProgressModal } from './ProgressModal'

const DownloadSelectorCheckbox = ({
  optionText,
  isChecked,
  onChange,
}: {
  optionText: string
  isChecked: boolean
  onChange: () => void
}) => {
  return (
    <Checkbox isChecked={isChecked} onChange={onChange} px="1rem" py="0.75rem">
      {optionText}
    </Checkbox>
  )
}

const DownloadSelector = ({
  onClickNext,
  onDownload,
  downloadOptions,
  setDownloadOptions,
}: {
  onClickNext: () => void
  downloadOptions: DownloadOptions
  onDownload: () => void
  setDownloadOptions: (downloadOptions: DownloadOptions) => void
}) => {
  const { t } = useTranslation('translation', {
    keyPrefix:
      'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadButton.menuItem',
  })

  const { isDownloadCsv, isDownloadAttachments, isDownloadPdf } =
    downloadOptions
  const onlyDownloadCsv =
    isDownloadCsv && !isDownloadAttachments && !isDownloadPdf
  const isDownloadOptionSelected =
    isDownloadCsv || isDownloadAttachments || isDownloadPdf

  return (
    <Stack>
      <CheckboxGroup value={['csv', 'attachments']}>
        <Stack direction="column">
          <DownloadSelectorCheckbox
            optionText={t('csv')}
            isChecked={isDownloadCsv}
            onChange={() =>
              setDownloadOptions({
                ...downloadOptions,
                isDownloadCsv: !isDownloadCsv,
              })
            }
          />
          <DownloadSelectorCheckbox
            optionText={t('attachments')}
            isChecked={isDownloadAttachments}
            onChange={() =>
              setDownloadOptions({
                ...downloadOptions,
                isDownloadAttachments: !isDownloadAttachments,
              })
            }
          />
          <DownloadSelectorCheckbox
            optionText={t('pdfs')}
            isChecked={isDownloadPdf}
            onChange={() =>
              setDownloadOptions({
                ...downloadOptions,
                isDownloadPdf: !isDownloadPdf,
              })
            }
          />
        </Stack>
      </CheckboxGroup>
      <Flex m="1rem" justify="flex-end">
        <Button
          isDisabled={!isDownloadOptionSelected}
          onClick={onlyDownloadCsv ? onDownload : onClickNext}
        >
          {onlyDownloadCsv ? 'Start download' : 'Next'}
        </Button>
      </Flex>
    </Stack>
  )
}

export const DownloadButton = (): JSX.Element => {
  const DEFAULT_DOWNLOAD_OPTIONS: DownloadOptions = useMemo(
    () => ({
      isDownloadAttachments: false,
      isDownloadCsv: false,
      isDownloadPdf: false,
    }),
    [],
  )
  const [downloadOptions, setDownloadOptions] = useState<DownloadOptions>(
    DEFAULT_DOWNLOAD_OPTIONS,
  )
  const resetDownloadOptions = useCallback(() => {
    setDownloadOptions(DEFAULT_DOWNLOAD_OPTIONS)
  }, [DEFAULT_DOWNLOAD_OPTIONS])

  const {
    isOpen: isDownloadModalOpen,
    onClose: onDownloadModalClose,
    onOpen: onDownloadModalOpen,
  } = useDisclosure({
    // Reset metadata if it exists.
    onOpen: () => resetDownloadMetadataAndProgress(),
  })
  const { isOpen: isProgressModalOpen, onClose: onProgressModalClose } =
    useDisclosure({
      // Reset metadata if it exists.
      onOpen: () => resetDownloadMetadataAndProgress(),
    })

  const toast = useToast({
    isClosable: true,
  })

  const { downloadParams, dateRangeResponsesCount } =
    useStorageResponsesContext()

  const [_downloadCount, setDownloadCount] = useState(0)
  const [_pdfGenerationCount, setPdfGenerationCount] = useState(0)
  const downloadCount = useThrottle(_downloadCount, 1000)
  const pdfGenerationCount = useThrottle(_pdfGenerationCount, 1000)

  const downloadPercentage = useMemo(() => {
    if (!dateRangeResponsesCount) return 0
    const currentDecryptAndPdfCount = downloadCount + pdfGenerationCount
    const totalDecryptAndPdfCount = downloadOptions.isDownloadPdf
      ? dateRangeResponsesCount * 2
      : dateRangeResponsesCount
    return Math.floor(
      (currentDecryptAndPdfCount / totalDecryptAndPdfCount) * 100,
    )
  }, [
    downloadCount,
    pdfGenerationCount,
    dateRangeResponsesCount,
    downloadOptions.isDownloadPdf,
  ])

  const [downloadMetadata, setDownloadMetadata] = useState<
    DownloadResult | CanceledResult
  >()

  const resetDownloadProgress = useCallback(() => {
    setDownloadCount(0)
    setPdfGenerationCount(0)
  }, [])
  const resetDownloadMetadataAndProgress = useCallback(() => {
    setDownloadMetadata(undefined)
    resetDownloadProgress()
  }, [])

  const { handleBulkDownloadMutation, abortDecryption } = useDecryptionWorkers({
    onDecryptionProgress: setDownloadCount,
    onPdfGenerationProgress: setPdfGenerationCount,
    mutateProps: {
      onMutate: () => {
        resetDownloadMetadataAndProgress()
      },
      onSuccess: ({ successCount, expectedCount, errorCount }) => {
        if (downloadParams?.responsesCount === 0) {
          toast({
            description: 'No responses to download',
          })
          return
        }
        if (errorCount > 0) {
          toast({
            status: 'warning',
            description: simplur`Partial success. ${successCount}/${expectedCount} ${[
              successCount,
            ]}response[|s] [was|were] decrypted. ${errorCount} failed.`,
          })
          return
        }
        toast({
          description: simplur`Success. ${successCount}/${expectedCount} ${[
            successCount,
          ]}response[|s] [was|were] decrypted.`,
        })
      },
      onError: () => {
        toast({
          status: 'danger',
          description: 'Failed to start download. Please try again later.',
        })
      },
      onSettled: (decryptResult) => {
        setDownloadMetadata(decryptResult)
        resetDownloadProgress()
        resetDownloadOptions()
      },
    },
  })

  const handleBulkDownload = useCallback(() => {
    if (!downloadParams) return
    datadogLogs.logger.info('Bulk download used', {
      meta: {
        action: 'bulkDownload',
        isDownloadCsv: downloadOptions.isDownloadCsv,
        isDownloadAttachments: downloadOptions.isDownloadAttachments,
        isDownloadPdf: downloadOptions.isDownloadPdf,
      },
    })
    return handleBulkDownloadMutation.mutate({
      ...downloadParams,
      downloadAttachments: downloadOptions.isDownloadAttachments,
      isDownloadCsv: downloadOptions.isDownloadCsv,
      isDownloadPdf: downloadOptions.isDownloadPdf,
    })
  }, [downloadParams, handleBulkDownloadMutation, downloadOptions])

  const resetDownload = useCallback(() => {
    resetDownloadProgress()
    abortDecryption()
    onProgressModalClose()
  }, [abortDecryption, onProgressModalClose])

  const handleModalClose = useCallback(() => {
    resetDownload()
    onDownloadModalClose()
    onProgressModalClose()
    resetDownloadMetadataAndProgress()
  }, [onDownloadModalClose, onProgressModalClose, resetDownload])

  const handleNoAttachmentsDownloadCancel = useCallback(() => {
    handleModalClose()
    toast({
      status: 'warning',
      description: 'Responses download has been canceled.',
    })
    setDownloadMetadata({ isCanceled: true })
  }, [handleModalClose, toast])

  const handleAttachmentsDownloadCancel = useCallback(() => {
    resetDownload()
    setDownloadMetadata({ isCanceled: true })
  }, [resetDownload])

  const { t } = useTranslation()

  return (
    <>
      <NavigationPrompt
        title={t(
          'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadButton.navigateAwayPrompt.title',
        )}
        description={t(
          'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadButton.navigateAwayPrompt.description',
        )}
        confirmButtonText={t(
          'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadButton.navigateAwayPrompt.confirmButtonText',
        )}
        when={handleBulkDownloadMutation.isLoading}
      />
      {dateRangeResponsesCount !== undefined && (
        <DownloadWithAttachmentModal
          responsesCount={dateRangeResponsesCount}
          isOpen={isDownloadModalOpen}
          onClose={handleModalClose}
          onDownload={handleBulkDownload}
          onCancel={handleAttachmentsDownloadCancel}
          downloadPercentage={downloadPercentage}
          isDownloading={handleBulkDownloadMutation.isLoading}
          downloadMetadata={downloadMetadata}
          downloadOptions={downloadOptions}
        />
      )}
      {dateRangeResponsesCount !== undefined && (
        <ProgressModal
          isOpen={isProgressModalOpen}
          onClose={handleModalClose}
          onCancel={handleNoAttachmentsDownloadCancel}
          downloadPercentage={downloadPercentage}
          downloadMetadata={downloadMetadata}
        >
          <Text mb="1rem">
            {t(
              'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadButton.progressModalContent',
              {
                dateRangeResponsesCount: (
                  <b>{dateRangeResponsesCount.toLocaleString()}</b>
                ),
              },
            )}
          </Text>
        </ProgressModal>
      )}
      <Box gridArea="export" justifySelf="flex-end">
        <Menu closeOnSelect={false} placement="bottom-end">
          {({ isOpen, onClose }) => (
            <>
              <MenuButton
                as={Button}
                isDisabled={!downloadParams}
                isLoading={handleBulkDownloadMutation.isLoading}
                isActive={isOpen}
                aria-label={t(
                  'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadButton.label',
                )}
                rightIcon={isOpen ? <BxsChevronUp /> : <BxsChevronDown />}
              >
                {t('features.common.download')}
              </MenuButton>
              <MenuList>
                <DownloadSelector
                  onClickNext={() => {
                    onClose()
                    onDownloadModalOpen()
                  }}
                  onDownload={() => {
                    onClose()
                    handleBulkDownload()
                  }}
                  downloadOptions={downloadOptions}
                  setDownloadOptions={setDownloadOptions}
                />
              </MenuList>
            </>
          )}
        </Menu>
      </Box>
    </>
  )
}
