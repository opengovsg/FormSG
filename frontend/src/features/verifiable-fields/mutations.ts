import { useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'

import { FormFieldWithId } from '~shared/types/field'

import { useToast } from '~hooks/useToast'

import { VerifiableFieldBase, VerifiableFieldSchema } from './types'
import {
  createTransactionForForm,
  triggerSendOtp,
  verifyOtp,
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

  const handleSendOtp = useCallback(
    async (answer: string) => {
      const transactionId = await getTransactionId()
      if (!transactionId) throw new Error('No transactionId generated')

      return triggerSendOtp({
        formId,
        transactionId,
        fieldId: schema._id,
        answer,
      })
    },
    [formId, getTransactionId, schema._id],
  )

  const triggerSendOtpMutation = useMutation(handleSendOtp, {
    onError: handleError,
  })

  // Exactly the same as sendOtp, but different mutation for different loading indicators
  const triggerResendOtpMutation = useMutation(handleSendOtp, {
    onError: handleError,
  })

  const verifyOtpMutation = useMutation(async (otp: string) => {
    const transactionId = await getTransactionId()
    if (!transactionId) throw new Error('No transactionId generated')
    return verifyOtp({ fieldId: schema._id, otp, formId, transactionId })
  })

  return {
    triggerSendOtpMutation,
    triggerResendOtpMutation,
    verifyOtpMutation,
  }
}
