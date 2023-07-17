import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { PaymentType } from '~shared/types'
import {
  AdminFormDto,
  AdminStorageFormDto,
  PaymentsUpdateDto,
} from '~shared/types/form'

import { useToast } from '~hooks/useToast'

import { updateFormPayments } from '~features/admin-form/common/AdminFormPageService'
import { adminFormKeys } from '~features/admin-form/common/queries'

import {
  PaymentState,
  setToInactiveSelector as setPaymentToInactiveSelector,
  stateSelector,
  usePaymentStore,
} from '../BuilderAndDesignDrawer/FieldListDrawer/field-panels/usePaymentStore'
import { deleteSingleFormField } from '../UpdateFormFieldService'
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
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const paymentDeleteDefault: PaymentsUpdateDto = {
    enabled: false,
    payment_type: PaymentType.Fixed,
    amount_cents: 0,
  }

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
        description:
          'Something went wrong when deleting your field. Please refresh and try again.',
      })
      return
    }
    toast({
      description: `The ${getMutationToastDescriptionFieldName(
        stateData.field,
      )} was deleted.`,
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
          description:
            'Something went wrong when deleting your field. Please refresh and try again.',
        })
      } else {
        oldForm.form_fields.splice(deletedFieldIndex, 1)
      }
      return oldForm
    })
    setToInactive()
  }, [adminFormKey, stateData, queryClient, setToInactive, toast])

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
    () => updateFormPayments(formId, paymentDeleteDefault),
    {
      onSuccess: (newData) => {
        toast.closeAll()
        if (paymentState !== PaymentState.EditingPayment) {
          toast({
            status: 'warning',
            description:
              'Something went wrong when deleting your field. Please refresh and try again.',
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
          description: 'The payment was deleted.',
        })
        setPaymentToInactive()
      },
      onError: handleError,
    },
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
    deletePaymentFieldMutation,
  }
}
