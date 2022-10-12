import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { FieldCreateDto, FormFieldDto } from '~shared/types/field'
import { AdminFormDto } from '~shared/types/form'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'

import { createSingleFormField } from '../UpdateFormFieldService'
import {
  FieldBuilderState,
  updateEditStateSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'
import {
  getMutationErrorMessage,
  getMutationToastDescriptionFieldName,
} from '../utils/getMutationMessage'

export const useCreateFormField = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const updateEditState = useFieldBuilderStore(updateEditStateSelector)

  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })
  const adminFormKey = adminFormKeys.id(formId)

  const handleSuccess = useCallback(
    (newField: FormFieldDto) => {
      toast.closeAll()
      const fieldBuilderStore = useFieldBuilderStore.getState()
      if (
        fieldBuilderStore.stateData.state !== FieldBuilderState.CreatingField
      ) {
        toast({
          status: 'warning',
          description:
            'Something went wrong when creating your field. Please refresh and try again.',
        })
        return
      }
      toast({
        description: `The ${getMutationToastDescriptionFieldName(
          newField,
        )} was created.`,
      })
      queryClient.setQueryData<AdminFormDto>(adminFormKey, (oldForm) => {
        // Should not happen, should not be able to update field if there is no
        // existing data.
        if (!oldForm) throw new Error('Query should have been set')
        if (
          fieldBuilderStore.stateData.state === FieldBuilderState.CreatingField
        ) {
          oldForm.form_fields.splice(
            fieldBuilderStore.stateData.insertionIndex,
            0,
            newField,
          )
        }
        return oldForm
      })
      // Switch from creation to editing
      updateEditState(newField)
    },
    [toast, queryClient, adminFormKey, updateEditState],
  )

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

  const getInsertionIndex = () => {
    const fieldBuilderStore = useFieldBuilderStore.getState()
    if (fieldBuilderStore.stateData.state === FieldBuilderState.CreatingField) {
      return fieldBuilderStore.stateData.insertionIndex
    }
  }

  return {
    createFieldMutation: useMutation(
      (createFieldBody: FieldCreateDto) =>
        createSingleFormField({
          formId,
          createFieldBody,
          insertionIndex: getInsertionIndex(),
        }),
      {
        onSuccess: handleSuccess,
        onError: handleError,
      },
    ),
  }
}
