import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import { useToast } from '@opengovsg/design-system-react'

import {
  AdminFormDto,
  FormResponseMode,
  FormWorkflowStep,
} from '~shared/types/form'

import { adminFormKeys } from '~features/admin-form/common/queries'

import { useAdminFormWorkflow } from './hooks/useAdminFormWorkflow'
import {
  createWorkflowStep,
  deleteWorkflowStep,
  updateWorkflowStep,
} from './FormWorkflowService'

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
        status: 'error',
      })
    },
    [toast],
  )

  const createStepMutation = useMutation(
    (createStepBody: FormWorkflowStep) =>
      createWorkflowStep(formId, formWorkflow, createStepBody),
    {
      onSuccess: (newSettings) => {
        toast.closeAll()
        queryClient.setQueryData<AdminFormDto>(adminFormKey, (prev) => {
          // Should not happen, should not be able to update field if there is no
          // existing data.
          if (!prev) throw new Error('Query should have been set')
          if (
            prev.responseMode !== FormResponseMode.Multirespondent ||
            newSettings.responseMode !== FormResponseMode.Multirespondent
          ) {
            throw new Error('Invalid response mode')
          }
          return { ...prev, workflow: newSettings.workflow }
        })
        toast({
          description: 'The step was successfully created.',
        })
      },
      onError: handleError,
    },
  )

  const deleteStepMutation = useMutation(
    (stepNumber: number) =>
      deleteWorkflowStep(formId, formWorkflow, stepNumber),
    {
      onSuccess: (newSettings) => {
        toast.closeAll()
        queryClient.setQueryData<AdminFormDto>(adminFormKey, (prev) => {
          // Should not happen, should not be able to update field if there is no
          // existing data.
          if (!prev) throw new Error('Query should have been set')
          if (
            prev.responseMode !== FormResponseMode.Multirespondent ||
            newSettings.responseMode !== FormResponseMode.Multirespondent
          ) {
            throw new Error('Invalid response mode')
          }
          return { ...prev, workflow: newSettings.workflow }
        })
        toast({
          description: 'The step was successfully deleted.',
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
      updateStepBody: FormWorkflowStep
    }) => updateWorkflowStep(formId, formWorkflow, stepNumber, updateStepBody),
    {
      onSuccess: (newSettings) => {
        toast.closeAll()
        queryClient.setQueryData<AdminFormDto>(adminFormKey, (prev) => {
          // Should not happen, should not be able to update field if there is no
          // existing data.
          if (!prev) throw new Error('Query should have been set')
          if (
            prev.responseMode !== FormResponseMode.Multirespondent ||
            newSettings.responseMode !== FormResponseMode.Multirespondent
          ) {
            throw new Error('Invalid response mode')
          }
          return { ...prev, workflow: newSettings.workflow }
        })
        toast({
          description: 'The step was successfully updated.',
        })
      },
      onError: handleError,
    },
  )

  return { createStepMutation, deleteStepMutation, updateStepMutation }
}
