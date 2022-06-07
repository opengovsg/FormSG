import { BiCheck } from 'react-icons/bi'
import {
  ButtonGroup,
  List,
  ListIcon,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import Badge from '~components/Badge'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { ModalCloseButton } from '~components/Modal'

export interface DownloadWithAttachmentModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  onDownload: () => void
  isDownloading: boolean
  responsesCount: number
  progress: number
}

const InlineTextListItem = ({
  children,
}: {
  children: string
}): JSX.Element => (
  <ListItem display="flex" alignItems="center">
    <ListIcon as={BiCheck} />
    {children}
  </ListItem>
)

export const DownloadWithAttachmentModal = ({
  isOpen,
  onClose,
  onDownload,
  isDownloading,
  responsesCount,
}: DownloadWithAttachmentModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">
          <Stack direction="row" align="center">
            <Text>Download responses and attachments</Text>
            <Badge w="fit-content" colorScheme="success">
              beta
            </Badge>
          </Stack>
        </ModalHeader>
        <ModalBody whiteSpace="pre-line" color="secondary.500">
          <Stack spacing="1rem">
            <Text>
              Separate zip files will be downloaded,{' '}
              <b>one for each response</b>. You can adjust the date range before
              proceeding.
              <br />
              <br />
              <b>Number of responses and attachments:</b>{' '}
              {responsesCount.toLocaleString()}
              <br />
              <b>Estimated time:</b> 30-50 mins per 1,000 responses
            </Text>
            <InlineMessage>
              <Stack>
                <Text textStyle="subhead-1">
                  Downloading many attachments can be an intensive operation.
                </Text>
                <List>
                  <InlineTextListItem>
                    Do not use Internet Explorer
                  </InlineTextListItem>
                  <InlineTextListItem>
                    Ensure network connectivity is strong
                  </InlineTextListItem>
                  <InlineTextListItem>
                    Ensure device has sufficient disk space for the download
                  </InlineTextListItem>
                </List>
              </Stack>
            </InlineMessage>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button
              variant="clear"
              colorScheme="secondary"
              onClick={onClose}
              isDisabled={isDownloading}
            >
              Cancel
            </Button>
            <Button onClick={onDownload} isLoading={isDownloading}>
              Start download
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
