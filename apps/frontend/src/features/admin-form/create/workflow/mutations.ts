import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import {
  AdminFormDto,
  FormResponseMode,
  WorkflowStepWriteDto,
} from 'formsg-shared/types/form'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'
import { adminFormSettingsKeys } from '~features/admin-form/settings/queries'
import { useAdminFeedbackStore } from '~features/workspace/components/AdminFeedbackContainer/adminFeedbackStore'

import { useAdminFormWorkflow } from './hooks/useAdminFormWorkflow'
import {
  createWorkflowStep,
  deleteWorkflow,
  deleteWorkflowStep,
  updateWorkflowStep,
} from './FormWorkflowService'
import { isWorkflowFeedbackEligible } from './workflow.utils'

export const useWorkflowMutations = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { formWorkflow, formFields } = useAdminFormWorkflow()
  if (!formWorkflow) throw new Error('No form workflow found')

  const queryClient = useQueryClient()
  const adminFormKey = adminFormKeys.id(formId)
  const toast = useToast({ status: 'success', isClosable: true })

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

  // Step saves may write form-level login fields, which the form and Settings queries hold.
  const refetchFormLevelLogin = useCallback(
    (body: WorkflowStepWriteDto, stepNumber: number) => {
      const isFormLevelChanged =
        body.first_step_login !== undefined ||
        body.esrvc_id !== undefined ||
        (stepNumber === 0 && body.whitelistCsvString !== undefined)
      if (!isFormLevelChanged) return
      void queryClient.invalidateQueries(adminFormKey)
      void queryClient.invalidateQueries(adminFormSettingsKeys.id(formId))
    },
    [adminFormKey, formId, queryClient],
  )

  const createStepMutation = useMutation(
    (createStepBody: WorkflowStepWriteDto) =>
      createWorkflowStep(formId, createStepBody),
    {
      onSuccess: (updatedWorkflow, createStepBody) => {
        toast.closeAll()
        queryClient.setQueryData<AdminFormDto>(adminFormKey, (prev) => {
          if (!prev) throw new Error('Query should have been set')
          if (prev.responseMode !== FormResponseMode.Multirespondent) {
            throw new Error('Invalid response mode')
          }
          return { ...prev, workflow: updatedWorkflow }
        })
        refetchFormLevelLogin(createStepBody, updatedWorkflow.length - 1)
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
    (stepNumber: number) => deleteWorkflowStep(formId, stepNumber),
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
        toast({
          description: 'The step was successfully deleted.',
        })
      },
      onError: handleError,
    },
  )

  const deleteWorkflowMutation = useMutation(() => deleteWorkflow(formId), {
    onSuccess: (updatedWorkflow) => {
      toast.closeAll()
      queryClient.setQueryData<AdminFormDto>(adminFormKey, (prev) => {
        if (!prev) throw new Error('Query should have been set')
        if (prev.responseMode !== FormResponseMode.Multirespondent) {
          throw new Error('Invalid response mode')
        }
        return { ...prev, workflow: updatedWorkflow }
      })
      toast({
        description: 'The workflow was successfully deleted.',
      })
    },
    onError: handleError,
  })

  const updateStepMutation = useMutation(
    ({
      stepNumber,
      updateStepBody,
    }: {
      stepNumber: number
      updateStepBody: WorkflowStepWriteDto
    }) => updateWorkflowStep(formId, stepNumber, updateStepBody),
    {
      onSuccess: (updatedWorkflow, { stepNumber, updateStepBody }) => {
        toast.closeAll()
        queryClient.setQueryData<AdminFormDto>(adminFormKey, (prev) => {
          if (!prev) throw new Error('Query should have been set')
          if (prev.responseMode !== FormResponseMode.Multirespondent) {
            throw new Error('Invalid response mode')
          }
          return { ...prev, workflow: updatedWorkflow }
        })
        refetchFormLevelLogin(updateStepBody, stepNumber)
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
