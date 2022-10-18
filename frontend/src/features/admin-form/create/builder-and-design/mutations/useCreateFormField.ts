import { useCallback, useMemo } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { FieldCreateDto, FormFieldDto } from '~shared/types/field'
import { AdminFormDto } from '~shared/types/form'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'

import { createSingleFormField } from '../UpdateFormFieldService'
import {
  FieldBuilderState,
  stateDataSelector,
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

  const { stateData, updateEditState } = useFieldBuilderStore(
    useCallback(
      (state) => ({
        stateData: stateDataSelector(state),
        updateEditState: updateEditStateSelector(state),
      }),
      [],
    ),
  )

  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })
  const adminFormKey = adminFormKeys.id(formId)

  const handleSuccess = useCallback(
    (newField: FormFieldDto) => {
      toast.closeAll()
      if (stateData.state !== FieldBuilderState.CreatingField) {
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
        oldForm.form_fields.splice(stateData.insertionIndex, 0, newField)
        return oldForm
      })
      // Switch from creation to editing
      updateEditState(newField)
    },
    [adminFormKey, stateData, queryClient, updateEditState, toast],
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

  const insertionIndex = useMemo(() => {
    if (stateData.state === FieldBuilderState.CreatingField) {
      return stateData.insertionIndex
    }
  }, [stateData])

  return {
    createFieldMutation: useMutation(
      (createFieldBody: FieldCreateDto) =>
        createSingleFormField({
          formId,
          createFieldBody,
          insertionIndex,
        }),
      {
        onSuccess: handleSuccess,
        onError: handleError,
      },
    ),
  }
}
