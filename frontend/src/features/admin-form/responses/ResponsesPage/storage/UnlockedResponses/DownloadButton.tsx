import { useMutation } from 'react-query'
import { Box, ButtonGroup, MenuButton } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import Badge from '~components/Badge'
import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Menu from '~components/Menu'

import useDecryptionWorkers from './useDecryptionWorkers'

export const DownloadButton = (): JSX.Element => {
  const { downloadEncryptedResponses } = useDecryptionWorkers()

  const handleExportCsvMutation = useMutation(
    () => downloadEncryptedResponses(),
    // TODO: add error and success handling
  )

  const handleExportCsv = () => {
    return handleExportCsvMutation.mutate()
  }

  return (
    <Box gridArea="export" justifySelf="flex-end">
      <Menu placement="bottom-end">
        {({ isOpen }) => (
          <>
            <ButtonGroup isAttached display="flex">
              <Button
                isLoading={handleExportCsvMutation.isLoading}
                px="1.5rem"
                mr="2px"
                onClick={handleExportCsv}
              >
                Download
              </Button>
              <MenuButton
                as={IconButton}
                isDisabled={handleExportCsvMutation.isLoading}
                isActive={isOpen}
                aria-label="More download options"
                icon={isOpen ? <BxsChevronUp /> : <BxsChevronDown />}
              />
            </ButtonGroup>
            <Menu.List>
              <Menu.Item>CSV only</Menu.Item>
              <Menu.Item>
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
