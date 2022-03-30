import { useCallback, useState } from 'react'
import { Box } from '@chakra-ui/react'

import { useToast } from '~hooks/useToast'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FeedbackFormInput } from './components/FeedbackBlock'
import { FormEndPage } from './FormEndPage'

export const FormEndPageContainer = (): JSX.Element | null => {
  const { form, submissionData } = usePublicFormContext()
  const toast = useToast()
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false)

  // TODO: Update with real API call
  const handleSubmitFeedback = useCallback(
    (inputs: FeedbackFormInput) => {
      toast({
        description: 'Thank you for submitting your feedback!',
        status: 'success',
        isClosable: true,
      })
      setIsFeedbackSubmitted(true)
    },
    [toast],
  )

  if (!form || !submissionData) return null

  return (
    <Box py={{ base: '1.5rem', md: '2.5rem' }}>
      <FormEndPage
        submissionData={submissionData}
        formTitle={form.title}
        endPage={form.endPage}
        isFeedbackSubmitted={isFeedbackSubmitted}
        handleSubmitFeedback={handleSubmitFeedback}
      />
    </Box>
  )
}
