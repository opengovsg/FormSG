import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { AdminFormDto, LogicDto } from '~shared/types/form'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'

import { deleteFormLogic } from './FormLogicService'

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
          description: 'Logic successfully deleted.',
        })
      },
      onError: handleError,
    },
  )

  return { deleteLogicMutation }
}
