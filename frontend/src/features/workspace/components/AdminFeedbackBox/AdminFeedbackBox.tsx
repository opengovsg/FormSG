import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { GoThumbsdown, GoThumbsup } from 'react-icons/go'
import { Flex, Link, Stack, Text } from '@chakra-ui/react'

import { AdminFeedbackRating } from '~shared/types'

import { BxX } from '~assets/icons'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import BottomHugBox from '~components/Hug/BottomHugBox'
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
    <BottomHugBox>
      <AdminFeedbackBoxContentBuilder
        state={contentState}
        onRatingClick={handleRatingClick}
        onCallForCommentClick={handleCallForCommentClick}
        onCommentClick={handleCommentClick}
        onClose={onClose}
        ratingValue={ratingValue}
      />
    </BottomHugBox>
  )
}

const AdminFeedbackRatingContent = ({
  onRatingClick,
}: {
  onRatingClick: (rating: AdminFeedbackRating) => void
}) => {
  const { t } = useTranslation()
  const {
    prompt,
    aria: { up, down },
  } = t('features.workspace.feedback.rating', { returnObjects: true })
  return (
    <Stack direction="row" alignItems="center" gap="0.75rem">
      <Text textStyle="h6" mr="0.75rem">
        {prompt}
      </Text>
      <IconButton
        variant="clear"
        icon={<GoThumbsup />}
        colorScheme="theme-blue"
        aria-label={up}
        onClick={() => onRatingClick(AdminFeedbackRating.up)}
      />
      <IconButton
        variant="clear"
        icon={<GoThumbsdown />}
        colorScheme="theme-red"
        aria-label={down}
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
  const { t } = useTranslation()
  const { title, link } = t(
    ratingValue === AdminFeedbackRating.up
      ? 'features.workspace.feedback.callForComment.up'
      : 'features.workspace.feedback.callForComment.down',
    { returnObjects: true },
  )
  return (
    <Text textStyle="h6">
      {`${title} `}
      <Link onClick={onLinkClick}>{link}</Link>
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
  const { t } = useTranslation()
  const { handleSubmit, register } = useForm<AdminFeedbackCommentForm>()
  const isMobile = useIsMobile()

  const ratingName = AdminFeedbackRating[
    ratingValue
  ] as keyof typeof AdminFeedbackRating
  const {
    title,
    description,
    placeholder,
    aria: { close },
  } = t('features.workspace.feedback.comment', {
    returnObjects: true,
  })

  return (
    <Stack w={isMobile ? undefined : '28.5rem'}>
      <Flex justifyContent="space-between" alignItems="center" mb="1rem">
        <Text textStyle="h2">{title}</Text>
        <IconButton
          aria-label={close}
          icon={<BxX />}
          variant="clear"
          color="black"
          onClick={onClose}
        />
      </Flex>
      <Text textStyle="body-2">{description}</Text>
      <Textarea
        mt="1rem"
        {...register('comment')}
        placeholder={placeholder[ratingName]}
      />
      <Flex alignItems="flex-end" flexDirection="column">
        <Button mt="1rem" float="right" onClick={handleSubmit(onCommentClick)}>
          {t('features.common.submit')}
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
