import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import { merge } from 'lodash'

import { FormFieldDto } from '~shared/types/field'
import { AdminFormDto } from '~shared/types/form'
import { reorder } from '~shared/utils/immutable-array-fns'

import { ApiError } from '~typings/core'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'

import { reorderSingleFormField } from '../UpdateFormFieldService'

export const useReorderFormField = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })
  const adminFormKey = adminFormKeys.id(formId)

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

  return {
    reorderFieldMutation: useMutation<
      FormFieldDto[],
      ApiError,
      { fields: AdminFormDto['form_fields']; from: number; to: number },
      { previousFormState?: AdminFormDto }
    >(
      ({ fields, from, to }) => {
        return reorderSingleFormField({
          formId,
          fieldId: fields[from]._id,
          newPosition: to,
        })
      },
      {
        onMutate: async ({ from, to }) => {
          // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
          await queryClient.cancelQueries(adminFormKey)
          const previousFormState =
            queryClient.getQueryData<AdminFormDto>(adminFormKey)

          if (previousFormState) {
            // Optimistically update to the new value
            queryClient.setQueryData<AdminFormDto>(adminFormKey, (old) => {
              if (!old) throw new Error('Query should have been set')
              const reorderedFields = reorder(old.form_fields, from, to)
              return merge({}, old, { form_fields: reorderedFields })
            })
          }
          // Return a context object with the snapshotted value
          return { previousFormState }
        },
        // If the mutation fails, use the context returned from onMutate to roll back
        onError: (err, _vars, context) => {
          handleError(err)
          if (context?.previousFormState) {
            queryClient.setQueryData(adminFormKey, context.previousFormState)
          }
        },
      },
    ),
  }
}
