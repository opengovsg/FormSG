import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { FormFieldDto } from '~shared/types/field'
import { AdminFormDto } from '~shared/types/form'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'

import { useAdminFormLogic } from '../../logic/hooks/useAdminFormLogic'
import { duplicateSingleFormField } from '../UpdateFormFieldService'
import {
  FieldBuilderState,
  fieldBuilderStateSelector,
  updateEditStateSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'
import {
  getMutationErrorMessage,
  getMutationToastDescriptionFieldName,
} from '../utils/getMutationMessage'

export const useDuplicateFormField = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')
  const fieldBuilderState = useFieldBuilderStore(fieldBuilderStateSelector)
  const updateEditState = useFieldBuilderStore(updateEditStateSelector)

  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })
  const adminFormKey = adminFormKeys.id(formId)

  const { logicedFieldIdsSet } = useAdminFormLogic()

  const handleSuccess = useCallback(
    (newField: FormFieldDto, fieldId: string) => {
      toast.closeAll()
      if (fieldBuilderState !== FieldBuilderState.EditingField) {
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
        )} was duplicated.${
          logicedFieldIdsSet?.has(fieldId)
            ? ' Associated logic was not duplicated.'
            : ''
        }`,
      })

      queryClient.setQueryData<AdminFormDto>(adminFormKey, (oldForm) => {
        // Should not happen, should not be able to update field if there is no
        // existing data.
        if (!oldForm) throw new Error('Query should have been set')
        oldForm.form_fields.push(newField)
        return oldForm
      })
      // Switch to editing new field
      updateEditState(newField)
    },
    [
      toast,
      fieldBuilderState,
      logicedFieldIdsSet,
      queryClient,
      adminFormKey,
      updateEditState,
    ],
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

  return {
    duplicateFieldMutation: useMutation(
      (fieldId: string) =>
        duplicateSingleFormField({
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
