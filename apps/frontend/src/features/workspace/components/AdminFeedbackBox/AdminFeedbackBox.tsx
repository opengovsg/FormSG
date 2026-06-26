import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Flex, Stack, Text } from '@chakra-ui/react'

import {
  AdminFeedbackRating,
  AdminFeedbackTriggerSource,
} from 'formsg-shared/types'

import { BxX } from '~assets/icons'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import { Rating } from '~components/Field/Rating/Rating'
import BottomHugBox from '~components/Hug/BottomHugBox'
import IconButton from '~components/IconButton'
import Textarea from '~components/Textarea'

import { useAdminFeedbackMutation } from '~features/workspace/mutations'

type AdminFeedbackCommentForm = {
  comment: string
}

const getCommentLabel = (
  rating: number,
  labels: { low: string; mid: string; high: string },
): string => {
  if (rating <= 2) return labels.low
  if (rating >= 4) return labels.high
  return labels.mid
}

export const AdminFeedbackBox = ({
  onClose,
  triggerSource,
  formId,
}: {
  onClose: () => void
  triggerSource?: AdminFeedbackTriggerSource
  formId?: string
}) => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [ratingValue, setRatingValue] = useState(0)
  const [feedbackId, setFeedbackId] = useState('')
  const { createAdminFeedbackMutation, updateAdminFeedbackMutation } =
    useAdminFeedbackMutation()
  const { handleSubmit, register } = useForm<AdminFeedbackCommentForm>()

  const { prompt, fieldTitle } = t('features.workspace.feedback.rating', {
    returnObjects: true,
  })
  const {
    label: commentLabels,
    placeholder,
    aria: { close: closeAriaLabel },
  } = t('features.workspace.feedback.comment', { returnObjects: true })

  const handleRatingChange = useCallback(
    (newRating: number | undefined) => {
      if (!newRating) return
      setRatingValue(newRating)

      if (!feedbackId) {
        // First star click: create the feedback record
        createAdminFeedbackMutation
          .mutateAsync({
            rating: newRating as AdminFeedbackRating,
            triggerSource,
            formId,
          })
          .then((data) => setFeedbackId(data._id))
      } else {
        // Subsequent star click: update the rating
        updateAdminFeedbackMutation.mutateAsync({
          feedbackId,
          rating: newRating as AdminFeedbackRating,
        })
      }
    },
    [
      feedbackId,
      createAdminFeedbackMutation,
      updateAdminFeedbackMutation,
      triggerSource,
      formId,
    ],
  )

  const handleCommentSubmit = useCallback(
    (data: AdminFeedbackCommentForm) => {
      if (feedbackId && data.comment) {
        updateAdminFeedbackMutation.mutateAsync({
          feedbackId,
          comment: data.comment,
        })
      }
      onClose()
    },
    [feedbackId, updateAdminFeedbackMutation, onClose],
  )

  return (
    <BottomHugBox>
      <Stack w={isMobile ? undefined : '28.5rem'}>
        <Flex justifyContent="space-between" alignItems="center">
          <Text textStyle="h6">{prompt}</Text>
          <IconButton
            aria-label={closeAriaLabel}
            icon={<BxX />}
            variant="clear"
            color="black"
            onClick={onClose}
          />
        </Flex>

        <Rating
          name="admin-feedback-rating"
          numberOfRatings={5}
          value={ratingValue}
          onChange={handleRatingChange}
          variant="star"
          isRequired={false}
          fieldTitle={fieldTitle}
        />

        {ratingValue > 0 && (
          <Stack mt="0.5rem">
            <Text textStyle="subhead-2">
              {getCommentLabel(ratingValue, commentLabels)}
            </Text>
            <Textarea {...register('comment')} placeholder={placeholder} />
            <Flex alignItems="flex-end" flexDirection="column">
              <Button
                mt="0.5rem"
                float="right"
                onClick={handleSubmit(handleCommentSubmit)}
              >
                {t('features.common.submit')}
              </Button>
            </Flex>
          </Stack>
        )}
      </Stack>
    </BottomHugBox>
  )
}
