import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { makeTextPrompt } from '~features/admin-form/assistance/AssistanceService'

import { useToast } from '../../../hooks/useToast'
import { adminFormKeys } from '../common/queries'

export const useAssistanceMutations = () => {
  const { formId } = useParams()

  if (!formId) {
    throw new Error('Form ID is required')
  }

  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })

  const useMakeTextPromptMutation = useMutation(
    (prompt: string) => makeTextPrompt({ formId, prompt }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(adminFormKeys.id(formId))
        toast.closeAll()
        toast({ description: 'Form generated successfully', status: 'success' })
      },
      onError: (error: Error) => {
        toast.closeAll()
        toast({
          description: error.message,
          status: 'danger',
        })
      },
    },
  )

  return {
    useMakeTextPromptMutation,
  }
}
