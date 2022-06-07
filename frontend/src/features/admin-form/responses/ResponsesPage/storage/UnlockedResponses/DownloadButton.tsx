import { useCallback, useState } from 'react'
import { useThrottle } from 'react-use'
import { Box, MenuButton, useDisclosure } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import { useTimeout } from '~hooks/useTimeout'
import Badge from '~components/Badge'
import Button from '~components/Button'
import Menu from '~components/Menu'

import { useStorageResponsesContext } from '../StorageResponsesContext'
import useDecryptionWorkers from '../useDecryptionWorkers'

import { DownloadModal } from './DownloadModal'
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
        <DownloadModal
          responsesCount={responsesCount}
          isOpen={isDownloadModalOpen}
          onClose={onDownloadModalClose}
          onDownload={handleExportCsvWithAttachments}
          isDownloading={handleExportCsvMutation.isLoading}
        />
      )}
      {responsesCount && (
        <ProgressModal
          isOpen={isProgressModalOpen}
          onClose={handleAbortDecryption}
          responsesCount={responsesCount}
          progress={downloadCount}
          isDownloading={handleExportCsvMutation.isLoading}
        />
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
