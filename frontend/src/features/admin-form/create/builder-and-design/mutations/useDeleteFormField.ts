import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { AdminFormDto, AdminStorageFormDto } from '~shared/types/form'
import { PAYMENT_DELETE_DEFAULT } from '~shared/utils/payments'

import { useToast } from '~hooks/useToast'

import { updateFormPayments } from '~features/admin-form/common/AdminFormPageService'
import { adminFormKeys } from '~features/admin-form/common/queries'

import {
  PaymentState,
  setToInactiveSelector as setPaymentToInactiveSelector,
  stateSelector,
  usePaymentStore,
} from '../BuilderAndDesignDrawer/FieldListDrawer/field-panels/usePaymentStore'
import {
  deleteMultipleFormFields,
  deleteSingleFormField,
} from '../UpdateFormFieldService'
import {
  FieldBuilderState,
  setToInactiveSelector,
  stateDataSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'
import {
  getMutationErrorMessage,
  getMutationToastDescriptionFieldName,
} from '../utils/getMutationMessage'

export const useDeleteFormField = () => {
  const { t } = useTranslation()
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { stateData, setToInactive } = useFieldBuilderStore(
    useCallback(
      (state) => ({
        stateData: stateDataSelector(state),
        setToInactive: setToInactiveSelector(state),
      }),
      [],
    ),
  )

  const { paymentState, setPaymentToInactive } = usePaymentStore(
    useCallback(
      (state) => ({
        paymentState: stateSelector(state),
        setPaymentToInactive: setPaymentToInactiveSelector(state),
      }),
      [],
    ),
  )

  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })
  const adminFormKey = adminFormKeys.id(formId)

  const handleSuccess = useCallback(() => {
    toast.closeAll()
    if (stateData.state !== FieldBuilderState.EditingField) {
      toast({
        status: 'warning',
        description: t('features.adminForm.toasts.field.delete.error'),
      })
      return
    }
    toast({
      description: t('features.adminForm.toasts.field.delete.success', {
        field: getMutationToastDescriptionFieldName(stateData.field),
      }),
    })
    queryClient.setQueryData<AdminFormDto>(adminFormKey, (oldForm) => {
      // Should not happen, should not be able to update field if there is no
      // existing data.
      if (!oldForm) throw new Error('Query should have been set')
      const deletedFieldIndex = oldForm.form_fields.findIndex(
        (ff) => ff._id === stateData.field._id,
      )
      if (deletedFieldIndex < 0) {
        toast({
          status: 'warning',
          description: t('features.adminForm.toasts.field.delete.error'),
        })
      } else {
        oldForm.form_fields.splice(deletedFieldIndex, 1)
      }
      return oldForm
    })
    setToInactive()
  }, [adminFormKey, stateData, queryClient, setToInactive, toast, t])

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

  const deletePaymentFieldMutation = useMutation(
    () => updateFormPayments(formId, PAYMENT_DELETE_DEFAULT),
    {
      onSuccess: (newData) => {
        toast.closeAll()
        if (paymentState !== PaymentState.EditingPayment) {
          toast({
            status: 'warning',
            description: t('features.adminForm.toasts.field.delete.error'),
          })
          return
        }
        queryClient.setQueryData<AdminStorageFormDto | undefined>(
          adminFormKeys.id(formId),
          (oldData) => {
            return oldData ? { ...oldData, payments_field: newData } : undefined
          },
        )
        toast({
          description: t('features.adminForm.toasts.field.delete.success', {
            field: 'payment',
          }),
        })
        setPaymentToInactive()
      },
      onError: handleError,
    },
  )

  const handleDeleteMultipleFieldsSuccess = useCallback(
    (_data: unknown, fieldIds: string[]) => {
      queryClient.setQueryData<AdminFormDto>(adminFormKey, (oldForm) => {
        // Should not happen, should not be able to update field if there is no
        // existing data.
        if (!oldForm) throw new Error('Query should have been set')
        const deletedFieldIndices = fieldIds
          .map((fieldId) =>
            oldForm.form_fields.findIndex((ff) => ff._id === fieldId),
          )
          .filter((index) => index >= 0)
        oldForm.form_fields = oldForm.form_fields.filter(
          (_field, index) => !deletedFieldIndices.includes(index),
        )
        return oldForm
      })
      setToInactive()
    },
    [adminFormKey, queryClient, setToInactive],
  )

  const handleDeleteMultipleFieldsError = useCallback(
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
    deleteMultipleFormFieldsMutation: useMutation(
      (fieldIds: string[]) =>
        deleteMultipleFormFields({
          formId,
          fieldIds,
        }),
      {
        onSuccess: handleDeleteMultipleFieldsSuccess,
        onError: handleDeleteMultipleFieldsError,
      },
    ),
    deletePaymentFieldMutation,
  }
}
