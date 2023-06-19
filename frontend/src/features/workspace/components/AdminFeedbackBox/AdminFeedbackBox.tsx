import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { GoThumbsdown, GoThumbsup } from 'react-icons/go'
import { Flex, Link, Stack, Text } from '@chakra-ui/react'

import { AdminFeedbackRating } from '~shared/types'

import { BxX } from '~assets/icons'
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

export const AdminFeedbackBox = ({ onClose }: { onClose: () => void }) => {
  const [contentState, setContentState] = useState(
    FeedbackModalContentState.Rating,
  )
  const [feedbackId, setFeedbackId] = useState('')
  const { createAdminFeedbackMutation, updateAdminFeedbackMutation } =
    useAdminFeedbackMutation()

  const handleRatingClick = useCallback(
    (rating: AdminFeedbackRating) => {
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
    <Flex
      position="fixed"
      bottom="1.5rem"
      justifyContent="center"
      margin="auto"
      width="100%"
    >
      <Flex px="1.5rem" py="1rem" bgColor="white" boxShadow="md">
        <AdminFeedbackModalContentBuilder
          state={contentState}
          onRatingClick={handleRatingClick}
          onCallForCommentClick={handleCallForCommentClick}
          onCommentClick={handleCommentClick}
          onClose={onClose}
        />
      </Flex>
    </Flex>
  )
}

const AdminFeedbackRatingContent = ({
  onRatingClick,
}: {
  onRatingClick: (rating: AdminFeedbackRating) => void
}) => {
  return (
    <Stack direction="row" alignItems="center" gap="2.2rem">
      <Text textStyle="h6">How was your form building experience?</Text>
      <IconButton
        variant="clear"
        icon={<GoThumbsup />}
        colorScheme="theme-blue"
        aria-label="Good"
        onClick={() => onRatingClick(AdminFeedbackRating.up)}
      />
      <IconButton
        variant="clear"
        icon={<GoThumbsdown />}
        colorScheme="theme-red"
        aria-label="Bad"
        onClick={() => onRatingClick(AdminFeedbackRating.down)}
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
  onClose,
}: {
  onCommentClick: (data: AdminFeedbackCommentForm) => void
  onClose: () => void
}) => {
  const { handleSubmit, register } = useForm<AdminFeedbackCommentForm>()
  const isMobile = useIsMobile()
  return (
    <Stack w={isMobile ? undefined : '28.5rem'}>
      <Flex justifyContent="space-between" alignItems="center" mb="1rem">
        <Text textStyle="h2">Great!</Text>
        <IconButton
          aria-label="close feedback box"
          icon={<BxX />}
          variant="clear"
          color="black"
          onClick={onClose}
        />
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
  onClose,
}: {
  state: FeedbackModalContentState
  onRatingClick: (rating: AdminFeedbackRating) => void
  onCallForCommentClick: () => void
  onCommentClick: (data: AdminFeedbackCommentForm) => void
  onClose: () => void
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
      return (
        <AdminFeedbackCommentContent
          onCommentClick={onCommentClick}
          onClose={onClose}
        />
      )
  }
}
