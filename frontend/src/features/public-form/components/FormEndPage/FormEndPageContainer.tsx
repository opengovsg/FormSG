import { useCallback, useState } from 'react'
import { Box } from '@chakra-ui/react'
import { useToast } from '@opengovsg/design-system-react'

import { FormResponseMode } from '~shared/types'

import { useSubmitFormFeedbackMutation } from '~features/public-form/mutations'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FeedbackFormInput } from './components/FeedbackBlock'
import { PaymentEndPagePreview } from './components/PaymentEndPagePreview'
import { FormEndPage } from './FormEndPage'

export const FormEndPageContainer = (): JSX.Element | null => {
  const { form, formId, submissionData, isPreview } = usePublicFormContext()
  const { submitFormFeedbackMutation } = useSubmitFormFeedbackMutation(
    formId,
    submissionData?.id ?? '',
  )
  const toast = useToast()
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false)

  const isPaymentEnabled =
    form?.responseMode === FormResponseMode.Encrypt &&
    form.payments_field.enabled

  /**
   * Handles feedback submission
   * @param isPreview whether form is in preview mode
   */
  const handleSubmitFeedback = useCallback(
    (inputs: FeedbackFormInput) => {
      // no mutation required in preview-form mode
      if (isPreview) {
        toast({
          description:
            'Thank you for submitting your feedback! Since you are in preview mode, the feedback is not stored.',
          status: 'success',
          isClosable: true,
        })
        setIsFeedbackSubmitted(true)
        return
      }
      // mutateAsync for react-hook-form to show correct loading state.
      else {
        return submitFormFeedbackMutation.mutateAsync(inputs, {
          onSuccess: () => {
            toast({
              description: 'Thank you for submitting your feedback!',
              status: 'success',
              isClosable: true,
            })
            setIsFeedbackSubmitted(true)
          },
        })
      }
    },
    [isPreview, submitFormFeedbackMutation, toast],
  )

  if (!form || !submissionData) return null

  if (isPaymentEnabled) {
    return (
      <PaymentEndPagePreview
        submissionData={submissionData}
        endPage={form.endPage}
        handleSubmitFeedback={handleSubmitFeedback}
        isFeedbackSubmitted={isFeedbackSubmitted}
        colorTheme={form.startPage.colorTheme}
      />
    )
  }

  const isFeedbackHidden =
    // Feedback is not supported on MRF
    form.responseMode === FormResponseMode.Multirespondent ||
    isFeedbackSubmitted

  return (
    <Box py={{ base: '1.5rem', md: '2.5rem' }} w="100%">
      <FormEndPage
        colorTheme={form.startPage.colorTheme}
        submissionData={submissionData}
        formTitle={form.title}
        endPage={form.endPage}
        isFeedbackSectionHidden={isFeedbackHidden}
        handleSubmitFeedback={handleSubmitFeedback}
      />
    </Box>
  )
}
