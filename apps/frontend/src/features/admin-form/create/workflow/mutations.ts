import { useCallback } from 'react'
import { QueryClient, useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router'

import {
  AdminFormDto,
  AuthFieldDeletionInput,
  DeleteWorkflowAuthDto,
  FormResponseMode,
  FormWorkflowStepWriteDto,
} from 'formsg-shared/types/form'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'
import { adminFormSettingsKeys } from '~features/admin-form/settings/queries'
import { useAdminFeedbackStore } from '~features/workspace/components/AdminFeedbackContainer/adminFeedbackStore'

import { useAdminFormWorkflow } from './hooks/useAdminFormWorkflow'
import { useUsesStepLoginRules } from './hooks/useUsesStepLoginRules'
import {
  createWorkflowStep,
  deleteWorkflow,
  deleteWorkflowStep,
  updateWorkflowStep,
} from './FormWorkflowService'
import { isWorkflowFeedbackEligible } from './workflow.utils'

/** A login change can also change the form's fields and its settings. */
export const invalidateLoginQueries = (
  queryClient: QueryClient,
  formId: string,
) =>
  Promise.all([
    queryClient.invalidateQueries(adminFormKeys.id(formId)),
    queryClient.invalidateQueries(adminFormSettingsKeys.id(formId)),
    queryClient.invalidateQueries(adminFormSettingsKeys.whitelist(formId)),
  ])

export const useWorkflowMutations = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { formWorkflow, formFields } = useAdminFormWorkflow()
  if (!formWorkflow) throw new Error('No form workflow found')

  const queryClient = useQueryClient()
  const adminFormKey = adminFormKeys.id(formId)
  const toast = useToast({ status: 'success', isClosable: true })
  // Same gate as the delete modals and the API's step login rules.
  const usesStepLoginRules = useUsesStepLoginRules()

  // Under step login rules a workflow write may also change Step 1's login
  // and delete login fields, so refetch the form and its settings.
  const invalidateFormQueries = useCallback(() => {
    if (!usesStepLoginRules) return
    void invalidateLoginQueries(queryClient, formId)
  }, [formId, usesStepLoginRules, queryClient])

  const handleError = useCallback(
    (error: Error) => {
      toast.closeAll()
      toast({
        description: error.message,
        status: 'danger',
      })
    },
    [toast],
  )

  const createStepMutation = useMutation(
    (createStepBody: FormWorkflowStepWriteDto) =>
      createWorkflowStep(formId, createStepBody),
    {
      onSuccess: (updatedWorkflow) => {
        toast.closeAll()
        queryClient.setQueryData<AdminFormDto>(adminFormKey, (prev) => {
          if (!prev) throw new Error('Query should have been set')
          if (prev.responseMode !== FormResponseMode.Multirespondent) {
            throw new Error('Invalid response mode')
          }
          return { ...prev, workflow: updatedWorkflow }
        })
        invalidateFormQueries()
        toast({
          description: 'The step was successfully created.',
        })

        if (isWorkflowFeedbackEligible(updatedWorkflow, formFields ?? [])) {
          useAdminFeedbackStore.getState().setEligible('workflow', formId)
        }
      },
      onError: handleError,
    },
  )

  const deleteStepMutation = useMutation(
    ({
      stepNumber,
      confirmation,
    }: {
      stepNumber: number
      confirmation?: AuthFieldDeletionInput
    }) => deleteWorkflowStep(formId, stepNumber, confirmation),
    {
      onSuccess: (updatedWorkflow) => {
        toast.closeAll()
        queryClient.setQueryData<AdminFormDto>(adminFormKey, (prev) => {
          if (!prev) throw new Error('Query should have been set')
          if (prev.responseMode !== FormResponseMode.Multirespondent) {
            throw new Error('Invalid response mode')
          }
          return { ...prev, workflow: updatedWorkflow }
        })
        invalidateFormQueries()
        toast({
          description: 'The step was successfully deleted.',
        })
      },
      onError: handleError,
    },
  )

  const deleteWorkflowMutation = useMutation(
    (options?: DeleteWorkflowAuthDto) => deleteWorkflow(formId, options),
    {
      onSuccess: (updatedWorkflow) => {
        toast.closeAll()
        queryClient.setQueryData<AdminFormDto>(adminFormKey, (prev) => {
          if (!prev) throw new Error('Query should have been set')
          if (prev.responseMode !== FormResponseMode.Multirespondent) {
            throw new Error('Invalid response mode')
          }
          return { ...prev, workflow: updatedWorkflow }
        })
        invalidateFormQueries()
        toast({
          description: 'The workflow was successfully deleted.',
        })
      },
      onError: handleError,
    },
  )

  const updateStepMutation = useMutation(
    ({
      stepNumber,
      updateStepBody,
    }: {
      stepNumber: number
      updateStepBody: FormWorkflowStepWriteDto
    }) => updateWorkflowStep(formId, stepNumber, updateStepBody),
    {
      onSuccess: (updatedWorkflow) => {
        toast.closeAll()
        queryClient.setQueryData<AdminFormDto>(adminFormKey, (prev) => {
          if (!prev) throw new Error('Query should have been set')
          if (prev.responseMode !== FormResponseMode.Multirespondent) {
            throw new Error('Invalid response mode')
          }
          return { ...prev, workflow: updatedWorkflow }
        })
        invalidateFormQueries()
        toast({
          description: 'The step was successfully updated.',
        })

        if (isWorkflowFeedbackEligible(updatedWorkflow, formFields ?? [])) {
          useAdminFeedbackStore.getState().setEligible('workflow', formId)
        }
      },
      onError: handleError,
    },
  )

  return {
    createStepMutation,
    deleteStepMutation,
    deleteWorkflowMutation,
    updateStepMutation,
  }
}
