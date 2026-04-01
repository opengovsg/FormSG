import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import {
  makeTextPrompt,
  makeVisionPrompt,
} from '~features/admin-form/assistance/AssistanceService'

import { useToast } from '../../../hooks/useToast'
import { adminFormKeys } from '../common/queries'
import { useMagicFormBuilderStore } from '../create/builder-and-design/MagicFormBuilder/useMagicFormBuilderStore'

export const useAssistanceMutations = () => {
  const { formId } = useParams()
  const { t } = useTranslation()

  if (!formId) {
    throw new Error(
      t('features.common.adminFormMutations.errors.missingFormId'),
    )
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
      description: t(
        'features.adminForm.assistance.toasts.fieldsCreatedSuccess',
      ),
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
