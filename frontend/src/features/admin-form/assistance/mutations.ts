import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import {
  analyzeQuestion,
  ConversationTurn,
  getAutoSummary,
  getSuggestedQuestions,
  InterpretDataResponse,
  interpretData,
  makeTextPrompt,
  makeVisionPrompt,
} from '~features/admin-form/assistance/AssistanceService'

import { useToast } from '../../../hooks/useToast'
import { adminFormKeys } from '../common/queries'
import { useMagicFormBuilderStore } from '../create/builder-and-design/MagicFormBuilder/useMagicFormBuilderStore'

export const useAssistanceMutations = () => {
  const { formId } = useParams()

  if (!formId) {
    throw new Error('Form ID is required')
  }

  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })

  const onSuccess = (data: { message: string; createdFieldIds?: string[] }) => {
    const { createdFieldIds } = data
    useMagicFormBuilderStore.setState((state) => {
      return {
        recentlyCreatedFieldIds: {
          ...state.recentlyCreatedFieldIds,
          [formId]: new Set(createdFieldIds),
        },
      }
    })
    queryClient.invalidateQueries(adminFormKeys.id(formId))
    toast.closeAll()
    toast({
      description: 'Fields created successfully',
      status: 'success',
    })
  }

  const onError = (error: Error) => {
    toast.closeAll()
    toast({
      description: error.message,
      status: 'danger',
    })
  }

  const useMakeTextPromptMutation = useMutation(
    (prompt: string) => makeTextPrompt({ formId, prompt }),
    {
      onSuccess,
      onError,
    },
  )

  const useMakeVisionPromptMutation = useMutation(
    (imageDataUrls: string[]) => makeVisionPrompt({ formId, imageDataUrls }),
    {
      onSuccess,
      onError,
    },
  )

  return {
    useMakeTextPromptMutation,
    useMakeVisionPromptMutation,
  }
}

export const useAnalyzeQuestionMutation = (formId: string) => {
  const toast = useToast({ status: 'success', isClosable: true })

  return useMutation(
    ({ question }: { question: string }) =>
      analyzeQuestion({ formId, question }),
    {
      onError: (error: Error) => {
        toast.closeAll()
        toast({
          description: error.message || 'Failed to analyze question',
          status: 'danger',
        })
      },
    },
  )
}

export const useSuggestedQuestionsMutation = (formId: string) => {
  const toast = useToast({ status: 'success', isClosable: true })

  return useMutation(() => getSuggestedQuestions({ formId }), {
    onError: (error: Error) => {
      toast.closeAll()
      toast({
        description: error.message || 'Failed to generate suggested questions',
        status: 'danger',
      })
    },
  })
}

export const useInterpretDataMutation = (formId: string) => {
  const toast = useToast({ status: 'success', isClosable: true })

  return useMutation(
    ({
      question,
      responses,
      conversationHistory,
    }: {
      question: string
      responses: InterpretDataResponse[]
      conversationHistory?: ConversationTurn[]
    }) => interpretData({ formId, question, responses, conversationHistory }),
    {
      onError: (error: Error) => {
        toast.closeAll()
        toast({
          description: error.message || 'Failed to interpret data',
          status: 'danger',
        })
      },
    },
  )
}

export const useAutoSummaryMutation = (formId: string) => {
  const toast = useToast({ status: 'success', isClosable: true })

  return useMutation(
    ({ responses }: { responses: InterpretDataResponse[] }) =>
      getAutoSummary({ formId, responses }),
    {
      onError: (error: Error) => {
        toast.closeAll()
        toast({
          description: error.message || 'Failed to generate summary',
          status: 'danger',
        })
      },
    },
  )
}
