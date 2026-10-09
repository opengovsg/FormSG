import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from 'react-query'

import { ApiError } from '~typings/core'

import { useToast } from '~hooks/useToast'

import { addAssignees, stopWorkflow } from '../AdminSubmissionsService'
import { adminFormResponsesKeys } from '../queries'

import { WORKFLOW_ACTIONS_I18N } from './i18n'

export const useStopWorkflowMutation = (formId: string) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast({ isClosable: true })

  return useMutation(
    ({ submissionId, emails }: { submissionId: string; emails: string[] }) =>
      stopWorkflow({ formId, submissionId, emails }),
    {
      onSuccess: () => {
        toast({
          status: 'success',
          description: t(`${WORKFLOW_ACTIONS_I18N}.stopModal.toastSuccess`),
        })
      },
      onError: (error: ApiError) => {
        toast({ status: 'danger', description: error.message })
      },
      onSettled: () => {
        void queryClient.invalidateQueries(adminFormResponsesKeys.id(formId))
      },
    },
  )
}

export const useAddAssigneesMutation = (formId: string) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast({ isClosable: true })

  return useMutation(
    (params: {
      submissionId: string
      emails: string[]
      submissionSecretKey: string
      stepToken?: string
    }) => addAssignees({ formId, ...params }),
    {
      onSuccess: ({ emails }) => {
        toast({
          status: 'success',
          description: t(
            `${WORKFLOW_ACTIONS_I18N}.addAssigneeModal.toastSuccess`,
            { count: emails.length },
          ),
        })
      },
      onError: (error: ApiError) => {
        toast({ status: 'danger', description: error.message })
      },
      onSettled: () => {
        void queryClient.invalidateQueries(adminFormResponsesKeys.id(formId))
      },
    },
  )
}
