import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { AdminFormDto, FormLogic, LogicDto } from '~shared/types/form'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'

import {
  createFormLogic,
  deleteFormLogic,
  updateFormLogic,
} from './FormLogicService'

export const useLogicMutations = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

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

  const createLogicMutation = useMutation(
    (createLogicBody: FormLogic) => createFormLogic(formId, createLogicBody),
    {
      onSuccess: (createdLogic) => {
        toast.closeAll()
        queryClient.setQueryData<AdminFormDto>(adminFormKey, (prev) => {
          // Should not happen, should not be able to update field if there is no
          // existing data.
          if (!prev) throw new Error('Query should have been set')
          prev.form_logics.push(createdLogic)
          return prev
        })
        toast({
          description: 'The logic was successfully created.',
        })
      },
      onError: handleError,
    },
  )

  const deleteLogicMutation = useMutation(
    (logicId: LogicDto['_id']) => deleteFormLogic(formId, logicId),
    {
      onSuccess: (_data, logicId) => {
        toast.closeAll()
        queryClient.setQueryData<AdminFormDto>(adminFormKey, (prev) => {
          // Should not happen, should not be able to update field if there is no
          // existing data.
          if (!prev) throw new Error('Query should have been set')
          // Remove deleted logic.
          prev.form_logics = prev.form_logics.filter((l) => l._id !== logicId)
          return prev
        })
        toast({
          description: 'The logic was successfully deleted.',
        })
      },
      onError: handleError,
    },
  )

  const updateLogicMutation = useMutation(
    (updateLogicBody: LogicDto) => updateFormLogic(formId, updateLogicBody),
    {
      onSuccess: (updatedLogic) => {
        toast.closeAll()
        queryClient.setQueryData<AdminFormDto>(adminFormKey, (prev) => {
          // Should not happen, should not be able to update field if there is no
          // existing data.
          if (!prev) throw new Error('Query should have been set')
          // Update logic.
          prev.form_logics = prev.form_logics.map((l) => {
            if (l._id === updatedLogic._id) return updatedLogic
            return l
          })
          return prev
        })
        toast({
          description: 'The logic was successfully updated.',
        })
      },
      onError: handleError,
    },
  )

  return { createLogicMutation, deleteLogicMutation, updateLogicMutation }
}
