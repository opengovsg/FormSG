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

enum FeedbackBoxContentState {
  Rating,
  CallForComment,
  CommentBox,
}

type AdminFeedbackCommentForm = {
  comment: string
}

export const AdminFeedbackBox = ({ onClose }: { onClose: () => void }) => {
  const [contentState, setContentState] = useState(
    FeedbackBoxContentState.Rating,
  )
  const [feedbackId, setFeedbackId] = useState('')
  const [ratingValue, setRatingValue] = useState(AdminFeedbackRating.up)
  const { createAdminFeedbackMutation, updateAdminFeedbackMutation } =
    useAdminFeedbackMutation()

  const handleRatingClick = useCallback(
    (rating: AdminFeedbackRating) => {
      createAdminFeedbackMutation
        .mutateAsync(rating)
        .then((data) => setFeedbackId(data._id))
      setContentState(FeedbackBoxContentState.CallForComment)
      setRatingValue(rating)
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
    setContentState(FeedbackBoxContentState.CommentBox)

  return (
    <Flex
      position="fixed"
      bottom="1.5rem"
      justifyContent="center"
      margin="auto"
      width="100%"
    >
      <Flex px="1.5rem" py="1rem" bgColor="white" boxShadow="md">
        <AdminFeedbackBoxContentBuilder
          state={contentState}
          onRatingClick={handleRatingClick}
          onCallForCommentClick={handleCallForCommentClick}
          onCommentClick={handleCommentClick}
          onClose={onClose}
          ratingValue={ratingValue}
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
  ratingValue,
}: {
  onLinkClick: () => void
  ratingValue: AdminFeedbackRating
}) => {
  // Thumbs down
  if (ratingValue === AdminFeedbackRating.down)
    return (
      <Text textStyle="h6">
        Thank you for your feedback.{' '}
        <Link onClick={onLinkClick}>Tell us more so we can improve!</Link>
      </Text>
    )

  // Thumbs Up
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
  ratingValue,
}: {
  onCommentClick: (data: AdminFeedbackCommentForm) => void
  onClose: () => void
  ratingValue: AdminFeedbackRating
}) => {
  const { handleSubmit, register } = useForm<AdminFeedbackCommentForm>()
  const isMobile = useIsMobile()

  const inputPlaceholder =
    ratingValue === AdminFeedbackRating.up
      ? 'Form is awesome'
      : 'How can we improve your experience?'

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
        mt="1rem"
        {...register('comment')}
        placeholder={inputPlaceholder}
      />
      <Flex alignItems="flex-end" flexDirection="column">
        <Button mt="1rem" float="right" onClick={handleSubmit(onCommentClick)}>
          Submit
        </Button>
      </Flex>
    </Stack>
  )
}

const AdminFeedbackBoxContentBuilder = ({
  state,
  onRatingClick,
  onCallForCommentClick,
  onCommentClick,
  onClose,
  ratingValue,
}: {
  state: FeedbackBoxContentState
  onRatingClick: (rating: AdminFeedbackRating) => void
  onCallForCommentClick: () => void
  onCommentClick: (data: AdminFeedbackCommentForm) => void
  onClose: () => void
  ratingValue: AdminFeedbackRating
}) => {
  switch (state) {
    case FeedbackBoxContentState.Rating:
      return <AdminFeedbackRatingContent onRatingClick={onRatingClick} />
    case FeedbackBoxContentState.CallForComment:
      return (
        <AdminFeedbackCallForCommentContent
          onLinkClick={onCallForCommentClick}
          ratingValue={ratingValue}
        />
      )
    case FeedbackBoxContentState.CommentBox:
      return (
        <AdminFeedbackCommentContent
          onCommentClick={onCommentClick}
          onClose={onClose}
          ratingValue={ratingValue}
        />
      )
  }
}
