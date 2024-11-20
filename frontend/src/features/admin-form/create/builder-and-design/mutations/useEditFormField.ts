import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { FormFieldDto } from '~shared/types/field'
import { AdminFormDto } from '~shared/types/form'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'

import { updateSingleFormField } from '../UpdateFormFieldService'
import {
  FieldBuilderState,
  fieldBuilderStateSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'
import {
  getMutationErrorMessage,
  getMutationToastDescriptionFieldName,
} from '../utils/getMutationMessage'

export const useEditFormField = () => {
  const { t } = useTranslation()
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const fieldBuilderState = useFieldBuilderStore(fieldBuilderStateSelector)

  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })
  const adminFormKey = adminFormKeys.id(formId)

  const handleSuccess = useCallback(
    (newField: FormFieldDto) => {
      toast.closeAll()
      if (fieldBuilderState !== FieldBuilderState.EditingField) {
        toast({
          status: 'warning',
          description: t('features.adminForm.toasts.field.update.error'),
        })
        return
      }
      toast({
        description: t('features.adminForm.toasts.field.update.success', {
          field: getMutationToastDescriptionFieldName(newField),
        }),
      })
      queryClient.setQueryData<AdminFormDto>(adminFormKey, (oldForm) => {
        // Should not happen, should not be able to update field if there is no
        // existing data.
        if (!oldForm) throw new Error('Query should have been set')
        const currentFieldIndex = oldForm.form_fields.findIndex(
          (ff) => ff._id === newField._id,
        )
        oldForm.form_fields[currentFieldIndex] = newField
        return oldForm
      })
    },
    [adminFormKey, fieldBuilderState, queryClient, toast, t],
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
    editFieldMutation: useMutation(
      (updateFieldBody: FormFieldDto) =>
        updateSingleFormField({ formId, updateFieldBody }),
      {
        onSuccess: handleSuccess,
        onError: handleError,
      },
    ),
  }
}
