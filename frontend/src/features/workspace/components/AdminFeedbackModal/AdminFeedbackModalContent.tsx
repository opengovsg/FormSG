import { Dispatch, SetStateAction, useState } from 'react'
import { GoThumbsdown, GoThumbsup } from 'react-icons/go'
import {
  Link,
  ModalBody,
  ModalCloseButton,
  ModalHeader,
  Stack,
  Text,
} from '@chakra-ui/react'

import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Textarea from '~components/Textarea'

enum FeedbackModalContentState {
  Rating,
  CallForComment,
  CommentBox,
}

export const AdminFeedbackModalContent = ({
  onClose,
}: {
  onClose: () => void
}) => {
  const [contentState, setContentState] = useState(
    FeedbackModalContentState.Rating,
  )
  return AdminFeedbackModalContentBuilder(
    contentState,
    setContentState,
    onClose,
  )
}

const AdminFeedbackModalContentBuilder = (
  state: FeedbackModalContentState,
  setState: Dispatch<SetStateAction<FeedbackModalContentState>>,
  onClose: () => void,
) => {
  switch (state) {
    case FeedbackModalContentState.Rating:
      return (
        <ModalBody px="1.5rem" py="1rem">
          <Stack direction="row" alignItems="center" gap="2.2rem">
            <Text textStyle="h6">How was your form building experience?</Text>
            <IconButton
              variant="clear"
              icon={<GoThumbsup />}
              colorScheme="theme-blue"
              aria-label="Good"
              onClick={() => setState(FeedbackModalContentState.CallForComment)}
            />
            <IconButton
              variant="clear"
              icon={<GoThumbsdown />}
              colorScheme="theme-red"
              aria-label="Bad"
              onClick={() => setState(FeedbackModalContentState.CallForComment)}
            />
          </Stack>
        </ModalBody>
      )
    case FeedbackModalContentState.CallForComment:
      return (
        <ModalBody px="1.5rem" py="1rem">
          <Text textStyle="h6">
            Thank you, you're the best!{' '}
            <Link
              onClick={() => setState(FeedbackModalContentState.CommentBox)}
            >
              Want to tell us more?
            </Link>
          </Text>
        </ModalBody>
      )
    case FeedbackModalContentState.CommentBox:
      return (
        <ModalBody px="1.5rem" py="1rem">
          <ModalHeader px="0rem">Great!</ModalHeader>
          <ModalCloseButton />
          <Text textStyle="body-2">
            Tell us about your form building experience in more detail!
          </Text>
          <Textarea placeholder="Form is awesome" mt="1rem" />
          <Button mt="1rem" float="right" onClick={onClose}>
            Submit
          </Button>
        </ModalBody>
      )
  }
}
