import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import { merge, omit } from 'lodash'

import { FormField, FormFieldDto } from '~shared/types/field'
import { AdminFormDto } from '~shared/types/form'
import { reorder } from '~shared/utils/immutable-array-fns'

import { ApiError } from '~typings/core'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'

import { PENDING_CREATE_FIELD_ID } from './constants'
import {
  createSingleFormField,
  reorderSingleFormField,
  updateSingleFormField,
} from './UpdateFormFieldService'

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
        if (currentFieldIndex === -1) {
          old.form_fields.push(newData)
        } else {
          old.form_fields[currentFieldIndex] = newData
        }
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
    (updateFieldBody: FormField & { _id: string }) => {
      if (updateFieldBody._id === PENDING_CREATE_FIELD_ID) {
        return createSingleFormField({
          formId,
          createFieldBody: omit(updateFieldBody, '_id') as FormField,
        })
      }
      return updateSingleFormField({ formId, updateFieldBody })
    },
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

  const mutateReorderField = useMutation<
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
      mutationKey: adminFormFieldKeys.id(formId),
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
  )

  return { mutateFormField, mutateReorderField }
}
