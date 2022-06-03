import { useCallback } from 'react'
import { useMutation } from 'react-query'
import { Box, MenuButton, useDisclosure } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import Badge from '~components/Badge'
import Button from '~components/Button'
import Menu from '~components/Menu'

import { useStorageResponsesContext } from '../StorageResponsesContext'
import useDecryptionWorkers, {
  DownloadEncryptedParams,
} from '../useDecryptionWorkers'

import { DownloadModal } from './DownloadModal'

export const DownloadButton = (): JSX.Element => {
  const {
    isOpen: isDownloadModalOpen,
    onClose: onDownloadModalClose,
    onOpen: onDownloadModalOpen,
  } = useDisclosure()
  const { downloadEncryptedResponses } = useDecryptionWorkers()
  const { downloadParams, responsesCount } = useStorageResponsesContext()

  const handleExportCsvMutation = useMutation(
    (params: DownloadEncryptedParams) => downloadEncryptedResponses(params),
    // TODO: add error and success handling
    {
      onSuccess: () => {
        onDownloadModalClose()
      },
    },
  )

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
