import { useCallback, useMemo, useState } from 'react'
import { useThrottle } from 'react-use'
import { Box, MenuButton, Text, useDisclosure } from '@chakra-ui/react'
import simplur from 'simplur'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import { useTimeout } from '~hooks/useTimeout'
import { useToast } from '~hooks/useToast'
import Badge from '~components/Badge'
import Button from '~components/Button'
import Menu from '~components/Menu'
import { NavigationPrompt } from '~templates/NavigationPrompt'

import { useStorageResponsesContext } from '../StorageResponsesContext'
import { CanceledResult, DownloadResult } from '../types'
import useDecryptionWorkers from '../useDecryptionWorkers'

import { DownloadWithAttachmentModal } from './DownloadWithAttachmentModal'
import { ProgressModal } from './ProgressModal'

export const DownloadButton = (): JSX.Element => {
  const {
    isOpen: isDownloadModalOpen,
    onClose: onDownloadModalClose,
    onOpen: onDownloadModalOpen,
  } = useDisclosure({
    // Reset metadata if it exists.
    onOpen: () => setDownloadMetadata(undefined),
  })
  const {
    isOpen: isProgressModalOpen,
    onClose: onProgressModalClose,
    onOpen: onProgressModalOpen,
  } = useDisclosure({
    // Reset metadata if it exists.
    onOpen: () => setDownloadMetadata(undefined),
  })

  const toast = useToast({
    isClosable: true,
  })

  const [progressModalTimeout, setProgressModalTimeout] = useState<
    number | null
  >(null)
  const { downloadParams, dateRangeResponsesCount } =
    useStorageResponsesContext()

  const [_downloadCount, setDownloadCount] = useState(0)
  const downloadCount = useThrottle(_downloadCount, 1000)

  const downloadPercentage = useMemo(() => {
    if (!dateRangeResponsesCount) return 0
    return Math.floor((downloadCount / dateRangeResponsesCount) * 100)
  }, [downloadCount, dateRangeResponsesCount])

  useTimeout(onProgressModalOpen, progressModalTimeout)

  const [downloadMetadata, setDownloadMetadata] = useState<
    DownloadResult | CanceledResult
  >()

  const { handleExportCsvMutation, abortDecryption } = useDecryptionWorkers({
    onProgress: setDownloadCount,
    mutateProps: {
      onMutate: () => {
        // Reset metadata if it exists.
        setDownloadMetadata(undefined)
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
        setProgressModalTimeout(null)
        setDownloadMetadata(decryptResult)
      },
    },
  })

  const handleExportCsvNoAttachments = useCallback(() => {
    if (!downloadParams) return
    setProgressModalTimeout(5000)
    return handleExportCsvMutation.mutate({
      ...downloadParams,
      downloadAttachments: false,
    })
  }, [downloadParams, handleExportCsvMutation])

  const handleExportCsvWithAttachments = useCallback(() => {
    if (!downloadParams) return
    return handleExportCsvMutation.mutate({
      ...downloadParams,
      downloadAttachments: true,
    })
  }, [downloadParams, handleExportCsvMutation])

  const resetDownload = useCallback(() => {
    setDownloadCount(0)
    setProgressModalTimeout(null)
    abortDecryption()
    onProgressModalClose()
  }, [abortDecryption, onProgressModalClose])

  const handleModalClose = useCallback(() => {
    resetDownload()
    onDownloadModalClose()
    onProgressModalClose()
    setDownloadMetadata(undefined)
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

  return (
    <>
      <NavigationPrompt
        title="Stop downloading responses?"
        description="You are currently downloading form responses. The download will be aborted if you leave this page."
        confirmButtonText="Yes, leave this page"
        when={handleExportCsvMutation.isLoading}
      />
      {dateRangeResponsesCount !== undefined && (
        <DownloadWithAttachmentModal
          responsesCount={dateRangeResponsesCount}
          isOpen={isDownloadModalOpen}
          onClose={handleModalClose}
          onDownload={handleExportCsvWithAttachments}
          onCancel={handleAttachmentsDownloadCancel}
          downloadPercentage={downloadPercentage}
          isDownloading={handleExportCsvMutation.isLoading}
          downloadMetadata={downloadMetadata}
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
            <b>{dateRangeResponsesCount.toLocaleString()}</b> responses are
            being processed. Navigating away from this page will stop the
            download.
          </Text>
        </ProgressModal>
      )}
      <Box gridArea="export" justifySelf="flex-end">
        <Menu placement="bottom-end">
          {({ isOpen }) => (
            <>
              <MenuButton
                as={Button}
                isDisabled={!downloadParams}
                isLoading={handleExportCsvMutation.isLoading}
                isActive={isOpen}
                aria-label="Download options"
                rightIcon={isOpen ? <BxsChevronUp /> : <BxsChevronDown />}
              >
                Download
              </MenuButton>
              <Menu.List>
                <Menu.Item onClick={handleExportCsvNoAttachments}>
                  CSV only
                </Menu.Item>
                <Menu.Item onClick={onDownloadModalOpen}>
                  CSV with attachments
                  <Badge ml="0.5rem" colorScheme="success">
                    beta
                  </Badge>
                </Menu.Item>
              </Menu.List>
            </>
          )}
        </Menu>
      </Box>
    </>
  )
}
