import { useCallback, useState } from 'react'
import { Box } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types'

import { useToast } from '~hooks/useToast'

import {
  useSubmitFormFeedbackMutation,
  useSubmitFormRespondentCopyMutation,
} from '~features/public-form/mutations'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FeedbackFormInput } from './components/FeedbackBlock'
import { PaymentEndPagePreview } from './components/PaymentEndPagePreview'
import { RespondentCopyEmailBlockInput } from './components/RespondentCopyEmailBlock'
import { FormEndPage } from './FormEndPage'

export const FormEndPageContainer = (): JSX.Element | null => {
  const { form, formId, submissionData, isPreview } = usePublicFormContext()
  const { submitFormFeedbackMutation } = useSubmitFormFeedbackMutation(
    formId,
    submissionData?.id ?? '',
  )
  const { submitFormRespondentCopyMutation } =
    useSubmitFormRespondentCopyMutation(formId, submissionData?.id ?? '')

  const toast = useToast()
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false)

  const isPaymentEnabled =
    form?.responseMode === FormResponseMode.Encrypt &&
    form.payments_field.enabled

  const isMrf = form?.responseMode === FormResponseMode.Multirespondent
  /**
   * Handles feedback submission
   * @param isPreview whether form is in preview mode
   */
  const handleSubmitFeedback = useCallback(
    (_inputs: FeedbackFormInput) => {
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

      const inputs = isMrf
        ? { ..._inputs, mrfStep: submissionData?.mrfStep }
        : _inputs

      // mutateAsync for react-hook-form to show correct loading state.
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
    },
    [
      isPreview,
      submitFormFeedbackMutation,
      toast,
      isMrf,
      submissionData?.mrfStep,
    ],
  )

  /**
   * Handles respondent copy submission
   */
  const handleSubmitRespondentCopy = useCallback(
    (_inputs: RespondentCopyEmailBlockInput) => {
      if (isPreview) {
        toast({
          description:
            'Respondent copies sent! Since you are in preview mode, no actual emails were sent.',
          status: 'success',
          isClosable: true,
        })
        setIsFeedbackSubmitted(true)
        return
      }

      const inputs = {
        ..._inputs,
        respondentCopySecretKey: submissionData?.respondentCopySecretKey ?? '',
        respondentCopyPresignedUrl:
          submissionData?.respondentCopyPresignedUrl ?? '',
        ...(isMrf && { mrfStep: submissionData?.mrfStep }),
      }

      return submitFormRespondentCopyMutation.mutateAsync(inputs, {
        onSuccess: () => {
          toast({
            description:
              'A copy of your responses has been sent to all emails!',
            status: 'success',
            isClosable: true,
          })
        },
      })
    },
    [
      isPreview,
      submissionData?.respondentCopySecretKey,
      submissionData?.respondentCopyPresignedUrl,
      submissionData?.mrfStep,
      isMrf,
      submitFormRespondentCopyMutation,
      toast,
    ],
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

  return (
    <Box py={{ base: '1.5rem', md: '2.5rem' }} w="100%">
      <FormEndPage
        colorTheme={form.startPage.colorTheme}
        submissionData={submissionData}
        formTitle={form.title}
        endPage={form.endPage}
        isFeedbackSectionHidden={isFeedbackSubmitted}
        handleSubmitFeedback={handleSubmitFeedback}
        handleSubmitRespondentCopy={handleSubmitRespondentCopy}
      />
    </Box>
  )
}
