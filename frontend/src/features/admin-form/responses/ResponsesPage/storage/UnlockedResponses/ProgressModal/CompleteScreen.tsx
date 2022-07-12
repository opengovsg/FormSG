import { useMemo } from 'react'
import {
  Badge,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  Text,
  Wrap,
} from '@chakra-ui/react'
import simplur from 'simplur'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { ModalCloseButton } from '~components/Modal'

import { DownloadResult } from '../../types'

interface CompleteScreenProps {
  onClose: () => void
  downloadMetadata?: DownloadResult
}

export const CompleteScreen = ({
  onClose,
  downloadMetadata,
}: CompleteScreenProps): JSX.Element => {
  const isMobile = useIsMobile()

  const completionMessage = useMemo(() => {
    if (!downloadMetadata) return ''
    const { successCount, expectedCount } = downloadMetadata
    if (successCount >= expectedCount) {
      return 'All responses and attachments have been downloaded successfully.'
    }
    // Success count is less than expected count.
    // This means some responses were not downloaded successfully.
    // Show the user the number of responses that were not downloaded.
    return simplur`${successCount} of ${expectedCount} ${[
      successCount,
    ]}response[|s] ha[s|ve] been downloaded successfully.`
  }, [downloadMetadata])

  const attachmentErrorMessage = useMemo(() => {
    if (!downloadMetadata?.errorCount) return

    return (
      <InlineMessage variant="warning">
        {simplur`${downloadMetadata.errorCount} response[|s] could not be downloaded. Any attachments related to [that|these] response[|s] will also not be downloaded.\n\nRefer to the exported CSV file for details on responses and attachments that were downloaded successfully.`}
      </InlineMessage>
    )
  }, [downloadMetadata])

  return (
    <>
      <ModalCloseButton />
      <ModalHeader color="secondary.700" pr="4.5rem">
        <Wrap shouldWrapChildren direction="row" align="center">
          <Text>Download complete</Text>
          <Badge w="fit-content" colorScheme="success">
            beta
          </Badge>
        </Wrap>
      </ModalHeader>
      <ModalBody whiteSpace="pre-line" color="secondary.500">
        <Stack spacing="1rem">
          {attachmentErrorMessage}
          <Text>{completionMessage}</Text>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button isFullWidth={isMobile} onClick={onClose}>
          Back to responses
        </Button>
      </ModalFooter>
    </>
  )
}
