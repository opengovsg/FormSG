import { useCallback } from 'react'
import { useMutation } from 'react-query'

import { FormFieldWithId } from '~shared/types/field'

import { useToast } from '~hooks/useToast'

import { VerifiableFieldBase, VerifiableFieldSchema } from './types'
import {
  createTransactionForForm,
  triggerSendFormOtp,
  triggerSendPaymentOtp,
  verifyFormOtp,
  verifyPaymentOtp,
} from './VerifiableFieldService'

export const useTransactionMutations = (formId: string) => {
  const createTransactionMutation = useMutation(() =>
    createTransactionForForm(formId),
  )

  return {
    createTransactionMutation,
  }
}

interface UseVerifiableFieldMutationsProps {
  schema: VerifiableFieldSchema<FormFieldWithId<VerifiableFieldBase>>
  formId: string
  getTransactionId: () => Promise<string>
}

export const useVerifiableFieldMutations = ({
  schema,
  formId,
  getTransactionId,
}: UseVerifiableFieldMutationsProps) => {
  const toast = useToast({ status: 'success', isClosable: true })

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

  const handleSendFormOtp = useCallback(
    async (answer: string) => {
      const transactionId = await getTransactionId()
      if (!transactionId) throw new Error('No transactionId generated')

      return triggerSendFormOtp({
        formId,
        transactionId,
        fieldId: schema._id,
        answer,
      })
    },
    [formId, getTransactionId, schema._id],
  )

  const triggerSendFormOtpMutation = useMutation(handleSendFormOtp, {
    onError: handleError,
  })

  const handleSendPaymentOtp = useCallback(
    async (answer: string) => {
      const transactionId = await getTransactionId()
      if (!transactionId) throw new Error('No transactionId generated')

      return triggerSendPaymentOtp({
        formId,
        transactionId,
        answer,
      })
    },
    [formId, getTransactionId],
  )

  const triggerSendPaymentOtpMutation = useMutation(handleSendPaymentOtp, {
    onError: handleError,
  })

  // Exactly the same as sendOtp, but different mutation for different loading indicators
  const triggerResendFormOtpMutation = useMutation(handleSendFormOtp, {
    onError: handleError,
  })

  const verifyFormOtpMutation = useMutation(async (otp: string) => {
    const transactionId = await getTransactionId()
    if (!transactionId) throw new Error('No transactionId generated')
    return verifyFormOtp({ fieldId: schema._id, otp, formId, transactionId })
  })

  const verifyPaymentOtpMutation = useMutation(async (otp: string) => {
    const transactionId = await getTransactionId()
    if (!transactionId) throw new Error('No transactionId generated')
    return verifyPaymentOtp({ otp, formId, transactionId })
  })

  return {
    triggerSendFormOtpMutation,
    triggerResendFormOtpMutation,
    verifyFormOtpMutation,
    triggerSendPaymentOtpMutation,
    verifyPaymentOtpMutation,
  }
}
