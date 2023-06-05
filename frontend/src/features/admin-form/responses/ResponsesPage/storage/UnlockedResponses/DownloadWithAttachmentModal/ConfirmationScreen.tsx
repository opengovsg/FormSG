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

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { ModalCloseButton } from '~components/Modal'

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
}

export const ConfirmationScreen = ({
  onCancel,
  isDownloading,
  onDownload,
  responsesCount,
}: ConfirmationScreenProps): JSX.Element => {
  const isMobile = useIsMobile()

  return (
    <>
      <ModalCloseButton />
      <ModalHeader color="secondary.700" pr="4.5rem">
        <Wrap shouldWrapChildren direction="row" align="center">
          <Text>Download responses and attachments</Text>
          <Badge w="fit-content" colorScheme="success">
            beta
          </Badge>
        </Wrap>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap" color="secondary.500">
        <Stack spacing="1rem">
          <Text>
            Separate zip files will be downloaded, <b>one for each response</b>.
            You can adjust the date range before proceeding.
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
          {responsesCount === 0 && (
            <InlineMessage variant="warning">
              The date range you selected does not contain any responses. Please
              select a date range containing responses and try again.
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
            Start download
          </Button>
          <Button
            isFullWidth={isMobile}
            variant="clear"
            colorScheme="secondary"
            onClick={onCancel}
            isDisabled={isDownloading}
          >
            Cancel
          </Button>
        </Stack>
      </ModalFooter>
    </>
  )
}
