import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import {
  AdminFormDto,
  FormResponseMode,
  FormWorkflowStep,
} from 'formsg-shared/types/form'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'
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

  const { formWorkflow } = useAdminFormWorkflow()
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

  const createStepMutation = useMutation(
    (createStepBody: FormWorkflowStep) =>
      createWorkflowStep(formId, createStepBody),
    {
      onSuccess: (updatedWorkflow) => {
        toast.closeAll()
        queryClient.setQueryData<AdminFormDto>(adminFormKey, (prev) => {
          // Should not happen, should not be able to update field if there is no
          // existing data.
          if (!prev) throw new Error('Query should have been set')
          if (prev.responseMode !== FormResponseMode.Multirespondent) {
            throw new Error('Invalid response mode')
          }
          return { ...prev, workflow: updatedWorkflow }
        })
        toast({
          description: 'The step was successfully created.',
        })

        if (isWorkflowFeedbackEligible(updatedWorkflow)) {
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
          // Should not happen, should not be able to update field if there is no
          // existing data.
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
        description: 'Your workflow was deleted.',
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
      updateStepBody: FormWorkflowStep
    }) => updateWorkflowStep(formId, stepNumber, updateStepBody),
    {
      onSuccess: (updatedWorkflow) => {
        toast.closeAll()
        queryClient.setQueryData<AdminFormDto>(adminFormKey, (prev) => {
          // Should not happen, should not be able to update field if there is no
          // existing data.
          if (!prev) throw new Error('Query should have been set')
          if (prev.responseMode !== FormResponseMode.Multirespondent) {
            throw new Error('Invalid response mode')
          }
          return { ...prev, workflow: updatedWorkflow }
        })
        toast({
          description: 'The step was successfully updated.',
        })

        if (isWorkflowFeedbackEligible(updatedWorkflow)) {
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
