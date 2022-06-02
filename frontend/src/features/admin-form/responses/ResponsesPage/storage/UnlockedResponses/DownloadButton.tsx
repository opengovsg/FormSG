import { useCallback } from 'react'
import { useMutation } from 'react-query'
import { Box, ButtonGroup, MenuButton } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import Badge from '~components/Badge'
import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Menu from '~components/Menu'

import { EncryptedResponsesStreamParams } from '../StorageResponsesService'

import useDecryptionWorkers from './useDecryptionWorkers'

export const DownloadButton = (): JSX.Element => {
  const { downloadEncryptedResponses } = useDecryptionWorkers()

  const handleExportCsvMutation = useMutation(
    (queryParams: EncryptedResponsesStreamParams) =>
      downloadEncryptedResponses(queryParams),
    // TODO: add error and success handling
  )

  const handleExportCsvNoAttachments = useCallback(() => {
    return handleExportCsvMutation.mutate({ downloadAttachments: false })
  }, [handleExportCsvMutation])

  const handleExportCsvWithAttachments = useCallback(() => {
    return handleExportCsvMutation.mutate({ downloadAttachments: true })
  }, [handleExportCsvMutation])

  return (
    <Box gridArea="export" justifySelf="flex-end">
      <Menu placement="bottom-end">
        {({ isOpen }) => (
          <>
            <MenuButton
              as={Button}
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
              <Menu.Item onClick={handleExportCsvWithAttachments}>
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
  )
}
