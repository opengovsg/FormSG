import { useMutation } from 'react-query'

import { createTransactionForForm } from './VerifiableFieldService'

export const useTransactionMutations = (formId: string) => {
  const createTransactionMutation = useMutation(() =>
    createTransactionForForm(formId),
  )

  return {
    createTransactionMutation,
  }
}
