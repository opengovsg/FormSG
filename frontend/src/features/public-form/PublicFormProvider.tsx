import { useCallback, useMemo, useRef, useState } from 'react'
import { differenceInMilliseconds, isPast } from 'date-fns'

import { PUBLICFORM_REGEX } from '~constants/routes'
import { useTimeout } from '~hooks/useTimeout'
import { useToast } from '~hooks/useToast'
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
  const toast = useToast()
  const toastIdRef = useRef<string | number>()

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

  const expiryInMs = useMemo(() => {
    if (!vfnTransaction?.expireAt) return null
    return differenceInMilliseconds(
      new Date(vfnTransaction.expireAt),
      Date.now(),
    )
  }, [vfnTransaction])

  useTimeout(() => {
    if (toastIdRef.current) {
      toast.close(toastIdRef.current)
    }
    toastIdRef.current = toast({
      duration: null,
      status: 'warning',
      isClosable: true,
      description:
        'Your verified fields has expired. Please verify those fields again.',
    })
  }, expiryInMs)

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
        expiryInMs,
        ...rest,
      }}
    >
      {isFormNotFound ? <div>404</div> : children}
    </PublicFormContext.Provider>
  )
}
