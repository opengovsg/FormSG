import { useMutation } from 'react-query'
import { useParams } from 'react-router-dom'

import { makeTextPrompt } from '~features/admin-form/assistance/AssistanceService'

import { useToast } from '../../../hooks/useToast'

export const useAssistanceMutations = () => {
  const { formId } = useParams()

  if (!formId) {
    throw new Error('Form ID is required')
  }

  const toast = useToast({ status: 'success', isClosable: true })

  const useMakeTextPromptMutation = useMutation(
    (prompt: string) => makeTextPrompt({ formId, prompt }),
    {
      onSuccess: () => {
        toast({ description: 'Form generated successfully', status: 'success' })
      },
      onError() {
        toast({
          description: 'Failed to generate form.',
          status: 'danger',
        })
      },
    },
  )

  return {
    useMakeTextPromptMutation,
  }
}
