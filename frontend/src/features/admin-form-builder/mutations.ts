import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { FormFieldDto } from '~shared/types/field'
import { AdminFormDto } from '~shared/types/form'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'

import { updateSingleFormField } from './UpdateFormFieldService'

export const adminFormFieldKeys = {
  base: [...adminFormKeys.base, 'fields'] as const,
  id: (id: string) => [...adminFormFieldKeys.base, id] as const,
}

export const useMutateFormFields = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })
  const adminFormKey = adminFormKeys.id(formId)

  const handleSuccess = useCallback(
    ({
      newData,
      toastDescription,
    }: {
      newData: FormFieldDto
      toastDescription: string
    }) => {
      toast.closeAll()
      toast({
        description: toastDescription,
      })
      queryClient.setQueryData<AdminFormDto>(adminFormKey, (old) => {
        // Should not happen, should not be able to update field if there is no
        // existing data.
        if (!old) throw new Error('Query should have been set')
        const currentFieldIndex = old.form_fields.findIndex(
          (ff) => ff._id === newData._id,
        )
        old.form_fields[currentFieldIndex] = newData
        return old
      })
    },
    [adminFormKey, queryClient, toast],
  )

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

  const mutateFormField = useMutation(
    (updateFieldBody: FormFieldDto) =>
      updateSingleFormField({ formId, updateFieldBody }),
    {
      onSuccess: (newData) => {
        handleSuccess({
          newData,
          toastDescription: `Field "${newData.title}" updated`,
        })
      },
      onError: (error: Error, _newData, context) => {
        handleError(error)
      },
    },
  )

  return { mutateFormField }
}
