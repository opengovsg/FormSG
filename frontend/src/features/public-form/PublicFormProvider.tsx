import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Text } from '@chakra-ui/react'
import { differenceInMilliseconds, isPast } from 'date-fns'
import { isEqual } from 'lodash'
import get from 'lodash/get'
import simplur from 'simplur'

import { PublicFormViewDto } from '~shared/types/form'

import { PUBLICFORM_REGEX } from '~constants/routes'
import { useTimeout } from '~hooks/useTimeout'
import { useToast } from '~hooks/useToast'
import { HttpError } from '~services/ApiService'
import Link from '~components/Link'

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

  const [form, setForm] = useState<PublicFormViewDto>()

  const { createTransactionMutation } = useTransactionMutations(formId)
  const toast = useToast()
  const vfnToastIdRef = useRef<string | number>()
  const desyncToastIdRef = useRef<string | number>()

  useEffect(() => {
    if (data) {
      if (!form) {
        setForm(data)
      } else if (!desyncToastIdRef.current && !isEqual(data, form)) {
        desyncToastIdRef.current = toast({
          status: 'warning',
          title: (
            <Text textStyle="subhead-1">
              The form has been modified and your submission may fail.
            </Text>
          ),
          description: (
            <Text as="span">
              <Link href="">Refresh</Link> for the latest version of the form.
            </Text>
          ),
          duration: null,
        })
      }
    }
  }, [data, form, toast])

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

  const generateVfnExpiryToast = useCallback(() => {
    if (vfnToastIdRef.current) {
      toast.close(vfnToastIdRef.current)
    }
    const numVerifiable = form?.form.form_fields.filter((ff) =>
      get(ff, 'isVerifiable'),
    ).length

    if (numVerifiable) {
      vfnToastIdRef.current = toast({
        duration: null,
        status: 'warning',
        isClosable: true,
        description: simplur`Your verified field[|s] ${[
          numVerifiable,
        ]} [has|have] expired. Please verify [the|those] ${[
          numVerifiable,
        ]} field[|s] again.`,
      })
    }
  }, [form?.form.form_fields, toast])

  useTimeout(generateVfnExpiryToast, expiryInMs)

  return (
    <PublicFormContext.Provider
      value={{
        miniHeaderRef,
        formId,
        error,
        getTransactionId,
        expiryInMs,
        ...form,
        ...rest,
      }}
    >
      {isFormNotFound ? <div>404</div> : children}
    </PublicFormContext.Provider>
  )
}
