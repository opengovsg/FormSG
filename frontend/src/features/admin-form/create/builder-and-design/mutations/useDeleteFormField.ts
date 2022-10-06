import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { AdminFormDto } from '~shared/types/form'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'

import { deleteSingleFormField } from '../UpdateFormFieldService'
import {
  FieldBuilderState,
  setToInactiveSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'
import {
  getMutationErrorMessage,
  getMutationToastDescriptionFieldName,
} from '../utils/getMutationMessage'

export const useDeleteFormField = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const setToInactive = useFieldBuilderStore(setToInactiveSelector)

  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })
  const adminFormKey = adminFormKeys.id(formId)

  const handleSuccess = useCallback(() => {
    toast.closeAll()
    const fieldBuilderStore = useFieldBuilderStore.getState()
    if (fieldBuilderStore.stateData.state !== FieldBuilderState.EditingField) {
      toast({
        status: 'warning',
        description:
          'Something went wrong when deleting your field. Please refresh and try again.',
      })
      return
    }
    toast({
      description: `The ${getMutationToastDescriptionFieldName(
        fieldBuilderStore.stateData.field,
      )} was deleted.`,
    })
    queryClient.setQueryData<AdminFormDto>(adminFormKey, (oldForm) => {
      // Should not happen, should not be able to update field if there is no
      // existing data.
      if (!oldForm) throw new Error('Query should have been set')
      if (
        fieldBuilderStore.stateData.state === FieldBuilderState.EditingField
      ) {
        const deletedFieldId = fieldBuilderStore.stateData.field._id
        const deletedFieldIndex = oldForm.form_fields.findIndex(
          (ff) => ff._id === deletedFieldId,
        )
        if (deletedFieldIndex < 0) {
          toast({
            status: 'warning',
            description:
              'Something went wrong when deleting your field. Please refresh and try again.',
          })
        } else {
          oldForm.form_fields.splice(deletedFieldIndex, 1)
        }
      }
      return oldForm
    })
    setToInactive()
  }, [adminFormKey, queryClient, setToInactive, toast])

  const handleError = useCallback(
    (error: Error) => {
      toast.closeAll()
      toast({
        description: getMutationErrorMessage(error),
        status: 'danger',
      })
    },
    [toast],
  )

  return {
    deleteFieldMutation: useMutation(
      (fieldId: string) =>
        deleteSingleFormField({
          formId,
          fieldId,
        }),
      {
        onSuccess: handleSuccess,
        onError: handleError,
      },
    ),
  }
}
