import { useCallback, useMemo, useState } from 'react'
import { useThrottle } from 'react-use'
import { Box, MenuButton, Text, useDisclosure } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import { useTimeout } from '~hooks/useTimeout'
import Badge from '~components/Badge'
import Button from '~components/Button'
import Menu from '~components/Menu'

import { useStorageResponsesContext } from '../StorageResponsesContext'
import useDecryptionWorkers from '../useDecryptionWorkers'

import { DownloadWithAttachmentModal } from './DownloadWithAttachmentModal'
import { ProgressModal } from './ProgressModal'

export const DownloadButton = (): JSX.Element => {
  const {
    isOpen: isDownloadModalOpen,
    onClose: onDownloadModalClose,
    onOpen: onDownloadModalOpen,
  } = useDisclosure()
  const {
    isOpen: isProgressModalOpen,
    onClose: onProgressModalClose,
    onOpen: onProgressModalOpen,
  } = useDisclosure()

  const [progressModalTimeout, setProgressModalTimeout] = useState<
    number | null
  >(null)
  const { downloadParams, responsesCount } = useStorageResponsesContext()
  const [_downloadCount, setDownloadCount] = useState(0)
  const downloadCount = useThrottle(_downloadCount, 1000)

  const downloadPercentage = useMemo(() => {
    if (!responsesCount) return 0
    return Math.floor((downloadCount / responsesCount) * 100)
  }, [downloadCount, responsesCount])

  useTimeout(onProgressModalOpen, progressModalTimeout)

  const { handleExportCsvMutation, abortDecryption } = useDecryptionWorkers({
    onProgress: setDownloadCount,
    mutateProps: {
      onMutate: () => {
        setProgressModalTimeout(5000)
      },
      onSuccess: () => {
        onDownloadModalClose()
      },
      onSettled: () => {
        setProgressModalTimeout(null)
        setDownloadCount(0)
      },
    },
  })

  const handleExportCsvNoAttachments = useCallback(() => {
    if (!downloadParams) return
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

  const handleAbortDecryption = useCallback(() => {
    setProgressModalTimeout(null)
    abortDecryption()
    onProgressModalClose()
  }, [abortDecryption, onProgressModalClose])

  return (
    <>
      {responsesCount && (
        <DownloadWithAttachmentModal
          responsesCount={responsesCount}
          isOpen={isDownloadModalOpen}
          onClose={onDownloadModalClose}
          onDownload={handleExportCsvWithAttachments}
          progress={downloadCount}
          isDownloading={handleExportCsvMutation.isLoading}
        />
      )}
      {responsesCount && (
        <ProgressModal
          isOpen={isProgressModalOpen}
          onClose={handleAbortDecryption}
          downloadPercentage={downloadPercentage}
          isDownloading={handleExportCsvMutation.isLoading}
        >
          <Text mb="1rem">
            <b>{responsesCount.toLocaleString()}</b> responses are being
            processed. Navigating away from this page will stop the download.
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
