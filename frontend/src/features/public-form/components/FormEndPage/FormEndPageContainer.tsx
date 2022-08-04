import { useCallback, useState } from 'react'
import { Box } from '@chakra-ui/react'

import { useToast } from '~hooks/useToast'

import { usePublicFormMutations } from '~features/public-form/mutations'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FeedbackFormInput } from './components/FeedbackBlock'
import { FormEndPage } from './FormEndPage'

interface FormEndPageContainerProps {
  isPreview?: boolean
}

export const FormEndPageContainer = ({
  isPreview,
}: FormEndPageContainerProps): JSX.Element | null => {
  const { form, formId, submissionData } = usePublicFormContext()
  const { submitFormFeedbackMutation } = usePublicFormMutations(
    formId,
    submissionData?.id ?? '',
  )
  const toast = useToast()
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false)

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

  return (
    <Box py={{ base: '1.5rem', md: '2.5rem' }} w="100%">
      <FormEndPage
        colorTheme={form.startPage.colorTheme}
        submissionData={submissionData}
        formTitle={form.title}
        endPage={form.endPage}
        isFeedbackSubmitted={isFeedbackSubmitted}
        handleSubmitFeedback={handleSubmitFeedback}
      />
    </Box>
  )
}
