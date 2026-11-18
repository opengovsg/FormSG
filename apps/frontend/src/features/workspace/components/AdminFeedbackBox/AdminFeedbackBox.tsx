import { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Flex, Stack, Text } from '@chakra-ui/react'

import {
  AdminCsatScore,
  AdminFeedbackDto,
  AdminFeedbackTriggerSource,
} from 'formsg-shared/types'

import { BxX } from '~assets/icons'
import { useIsMobile } from '~hooks/useIsMobile'
import { useToast } from '~hooks/useToast'
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
  const toast = useToast({ isClosable: true })
  const [ratingValue, setRatingValue] = useState(0)
  const [feedbackId, setFeedbackId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
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
  const { success: successMessage, submitError: submitErrorMessage } = t(
    'features.workspace.feedback.toast',
    { returnObjects: true },
  )

  const showSubmitError = useCallback(
    () => toast({ description: submitErrorMessage, status: 'danger' }),
    [toast, submitErrorMessage],
  )
  const showSuccess = useCallback(
    () => toast({ description: successMessage, status: 'success' }),
    [toast, successMessage],
  )

  // `feedbackId` is only set once the create resolves, so it is empty for a
  // moment after the first star click. Anything firing in that window must reuse
  // the in-flight create rather than starting a second one, or we write a
  // duplicate row and a duplicate `.csat` metric. Correcting a rating (3 then 4)
  // lands in that window routinely, so this is the common path, not an edge case.
  const createPromiseRef = useRef<Promise<AdminFeedbackDto> | null>(null)
  const latestRatingRef = useRef(0)

  const syncRating = useCallback(
    (id: string) =>
      updateAdminFeedbackMutation
        .mutateAsync({
          feedbackId: id,
          csat: latestRatingRef.current as AdminCsatScore,
        })
        .catch(() => undefined),
    [updateAdminFeedbackMutation],
  )

  const handleRatingChange = useCallback(
    (newRating: number | undefined) => {
      if (!newRating) return
      setRatingValue(newRating)
      latestRatingRef.current = newRating

      if (feedbackId) {
        syncRating(feedbackId)
        return
      }

      // A create is already covering this prompt; its handler syncs the final
      // rating once it lands.
      if (createPromiseRef.current) return

      const pending = createAdminFeedbackMutation.mutateAsync({
        csat: newRating as AdminCsatScore,
        triggerSource,
        formId,
      })
      createPromiseRef.current = pending
      pending
        .then((created) => {
          setFeedbackId(created._id)
          // The admin may have moved the rating while this was in flight.
          if (latestRatingRef.current !== newRating) syncRating(created._id)
        })
        // Deliberately silent. The admin did not ask to save yet, so a failure
        // here should not interrupt them. Submit retries the create, so a
        // transient failure repairs itself.
        .catch(() => {
          createPromiseRef.current = null
        })
    },
    [
      feedbackId,
      createAdminFeedbackMutation,
      syncRating,
      triggerSource,
      formId,
    ],
  )

  const handleCommentSubmit = useCallback(
    (data: AdminFeedbackCommentForm) => {
      if (isSubmitting) return
      setIsSubmitting(true)

      // The box closes on success, so the confirmation has to outlive it. That
      // rules out an inline success state and is why this is a toast. On
      // failure the box stays open so nothing typed is lost.
      const onSaved = () => {
        showSuccess()
        onClose()
      }
      const onFailed = () => {
        showSubmitError()
        setIsSubmitting(false)
      }
      const addComment = (id: string): Promise<void> =>
        data.comment
          ? updateAdminFeedbackMutation
              .mutateAsync({ feedbackId: id, comment: data.comment })
              .then(() => undefined)
          : Promise.resolve()

      if (feedbackId) {
        addComment(feedbackId).then(onSaved).catch(onFailed)
        return
      }

      // Still creating. Wait for that record rather than starting a second one.
      const pending = createPromiseRef.current
      if (pending) {
        pending
          .then((created) => addComment(created._id))
          .then(onSaved)
          .catch(onFailed)
        return
      }

      // No record and nothing in flight, so the star click's create never
      // landed. Create it now with the rating and comment together rather than
      // reporting a failure the admin was never told about.
      createAdminFeedbackMutation
        .mutateAsync({
          csat: ratingValue as AdminCsatScore,
          comment: data.comment || undefined,
          triggerSource,
          formId,
        })
        .then((created) => {
          setFeedbackId(created._id)
          onSaved()
        })
        .catch(onFailed)
    },
    [
      isSubmitting,
      feedbackId,
      ratingValue,
      createAdminFeedbackMutation,
      updateAdminFeedbackMutation,
      triggerSource,
      formId,
      onClose,
      showSuccess,
      showSubmitError,
    ],
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
                isLoading={isSubmitting}
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
