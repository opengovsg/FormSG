import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { GoThumbsdown, GoThumbsup } from 'react-icons/go'
import {
  Flex,
  Link,
  ModalBody,
  ModalCloseButton,
  ModalHeader,
  Stack,
  Text,
} from '@chakra-ui/react'

import { AdminFeedbackRatingDown, AdminFeedbackRatingUp } from '~shared/types'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Textarea from '~components/Textarea'

import { useAdminFeedbackMutation } from '~features/workspace/mutations'

enum FeedbackModalContentState {
  Rating,
  CallForComment,
  CommentBox,
}

type AdminFeedbackCommentForm = {
  comment: string
}

export const AdminFeedbackModalContent = ({
  onClose,
}: {
  onClose: () => void
}) => {
  const [contentState, setContentState] = useState(
    FeedbackModalContentState.Rating,
  )
  const [feedbackId, setFeedbackId] = useState('')
  const { createAdminFeedbackMutation, updateAdminFeedbackMutation } =
    useAdminFeedbackMutation()

  const handleRatingClick = useCallback(
    (rating: number) => {
      createAdminFeedbackMutation
        .mutateAsync(rating)
        .then((data) => setFeedbackId(data._id))
      setContentState(FeedbackModalContentState.CallForComment)
    },
    [createAdminFeedbackMutation, setFeedbackId, setContentState],
  )

  const handleCommentClick = useCallback(
    (data: AdminFeedbackCommentForm) => {
      if (feedbackId && !!data.comment) {
        updateAdminFeedbackMutation.mutateAsync({
          feedbackId,
          comment: data.comment,
        })
      }
      onClose()
    },
    [feedbackId, updateAdminFeedbackMutation, onClose],
  )

  const handleCallForCommentClick = () =>
    setContentState(FeedbackModalContentState.CommentBox)

  return (
    <ModalBody px="1.5rem" py="1rem">
      <AdminFeedbackModalContentBuilder
        state={contentState}
        onRatingClick={handleRatingClick}
        onCallForCommentClick={handleCallForCommentClick}
        onCommentClick={handleCommentClick}
      />
    </ModalBody>
  )
}

const AdminFeedbackRatingContent = ({
  onRatingClick,
}: {
  onRatingClick: (rating: number) => void
}) => {
  return (
    <Stack direction="row" alignItems="center" gap="2.2rem">
      <Text textStyle="h6">How was your form building experience?</Text>
      <IconButton
        variant="clear"
        icon={<GoThumbsup />}
        colorScheme="theme-blue"
        aria-label="Good"
        onClick={() => onRatingClick(AdminFeedbackRatingUp)}
      />
      <IconButton
        variant="clear"
        icon={<GoThumbsdown />}
        colorScheme="theme-red"
        aria-label="Bad"
        onClick={() => onRatingClick(AdminFeedbackRatingDown)}
      />
    </Stack>
  )
}

const AdminFeedbackCallForCommentContent = ({
  onLinkClick,
}: {
  onLinkClick: () => void
}) => {
  return (
    <Text textStyle="h6">
      Thank you, you're the best!{' '}
      <Link onClick={onLinkClick}>Want to tell us more?</Link>
    </Text>
  )
}

const AdminFeedbackCommentContent = ({
  onCommentClick,
}: {
  onCommentClick: (data: AdminFeedbackCommentForm) => void
}) => {
  const { handleSubmit, register } = useForm<AdminFeedbackCommentForm>()
  const isMobile = useIsMobile()
  return (
    <Stack w={isMobile ? undefined : '28.5rem'}>
      <Flex alignItems="flex-start">
        <ModalHeader px="0rem">Great!</ModalHeader>
        <ModalCloseButton />
      </Flex>
      <Text textStyle="body-2">
        Tell us about your form building experience in more detail!
      </Text>
      <Textarea
        placeholder="Form is awesome"
        mt="1rem"
        {...register('comment')}
      />
      <Flex alignItems="flex-end" flexDirection="column">
        <Button mt="1rem" float="right" onClick={handleSubmit(onCommentClick)}>
          Submit
        </Button>
      </Flex>
    </Stack>
  )
}

const AdminFeedbackModalContentBuilder = ({
  state,
  onRatingClick,
  onCallForCommentClick,
  onCommentClick,
}: {
  state: FeedbackModalContentState
  onRatingClick: (rating: number) => void
  onCallForCommentClick: () => void
  onCommentClick: (data: AdminFeedbackCommentForm) => void
}) => {
  switch (state) {
    case FeedbackModalContentState.Rating:
      return <AdminFeedbackRatingContent onRatingClick={onRatingClick} />
    case FeedbackModalContentState.CallForComment:
      return (
        <AdminFeedbackCallForCommentContent
          onLinkClick={onCallForCommentClick}
        />
      )
    case FeedbackModalContentState.CommentBox:
      return <AdminFeedbackCommentContent onCommentClick={onCommentClick} />
  }
}
