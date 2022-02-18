import { useCallback, useMemo, useRef, useState } from 'react'
import { isPast } from 'date-fns'

import { PUBLICFORM_REGEX } from '~constants/routes'
import { HttpError } from '~services/ApiService'

import {
  FetchNewTransactionResponse,
  useTransactionMutations,
} from '~features/verifiable-fields'

import { PublicFormContext } from './PublicFormContext'
import { usePublicFormView } from './queries'

interface PublicFormProviderProps {
  formId: string
  children: React.ReactNode
}

export const PublicFormProvider = ({
  formId,
  children,
}: PublicFormProviderProps): JSX.Element => {
  const [vfnTransaction, setVfnTransaction] =
    useState<FetchNewTransactionResponse>()
  const miniHeaderRef = useRef<HTMLDivElement>(null)
  const { data, error, ...rest } = usePublicFormView(formId)
  const { createTransactionMutation } = useTransactionMutations(formId)

  const getTransactionId = useCallback(async () => {
    if (!vfnTransaction || isPast(new Date(vfnTransaction.expireAt))) {
      const result = await createTransactionMutation.mutateAsync()
      setVfnTransaction(result)
      return result.transactionId
    }
    return vfnTransaction.transactionId
  }, [createTransactionMutation, vfnTransaction])

  const isFormNotFound = useMemo(() => {
    return (
      !PUBLICFORM_REGEX.test(formId) ||
      (error instanceof HttpError && error.code === 404)
    )
  }, [error, formId])

  return (
    <PublicFormContext.Provider
      value={{
        miniHeaderRef,
        formId,
        form: data?.form,
        isIntranetUser: data?.isIntranetUser,
        myInfoError: data?.myInfoError,
        spcpSession: data?.spcpSession,
        error,
        getTransactionId,
        ...rest,
      }}
    >
      {isFormNotFound ? <div>404</div> : children}
    </PublicFormContext.Provider>
  )
}
