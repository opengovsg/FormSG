import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

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
  const { t } = useTranslation()
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
          description: t('features.adminForm.toasts.field.duplicate.error'),
        })
        return
      }

      toast({
        description: t(
          logicedFieldIdsSet?.has(fieldId)
            ? 'features.adminForm.toasts.field.duplicate.successButNoLogic'
            : 'features.adminForm.toasts.field.duplicate.success',
          {
            field: getMutationToastDescriptionFieldName(newField),
          },
        ),
      })

      queryClient.setQueryData<AdminFormDto>(adminFormKey, (oldForm) => {
        // Should not happen, should not be able to update field if there is no
        // existing data.
        if (!oldForm) throw new Error('Query should have been set')
        const insertionIndex =
          oldForm.form_fields.findIndex((o) => o._id === fieldId) + 1
        if (insertionIndex > 0) {
          oldForm.form_fields.splice(insertionIndex, 0, newField)
        } else {
          // if index does not exist, push new field to end
          oldForm.form_fields.push(newField)
        }
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
      t,
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
