import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Text } from '@chakra-ui/react'
import { differenceInMilliseconds, isPast } from 'date-fns'
import { isEqual } from 'lodash'
import get from 'lodash/get'
import simplur from 'simplur'

import { FormFieldDto } from '~shared/types/field'
import { PublicFormViewDto } from '~shared/types/form'
import { FieldResponse } from '~shared/types/response'

import { PUBLICFORM_REGEX } from '~constants/routes'
import { useTimeout } from '~hooks/useTimeout'
import { useToast } from '~hooks/useToast'
import { HttpError } from '~services/ApiService'
import Link from '~components/Link'

import {
  FetchNewTransactionResponse,
  useTransactionMutations,
} from '~features/verifiable-fields'

import { transformInputsToOutputs } from './utils/inputTransformation'
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

  const [cachedDto, setCachedDto] = useState<PublicFormViewDto>()

  const { createTransactionMutation } = useTransactionMutations(formId)
  const toast = useToast()
  const vfnToastIdRef = useRef<string | number>()
  const desyncToastIdRef = useRef<string | number>()

  useEffect(() => {
    if (data) {
      if (!cachedDto) {
        setCachedDto(data)
      } else if (!desyncToastIdRef.current && !isEqual(data, cachedDto)) {
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
  }, [data, cachedDto, toast])

  const getTransactionId = useCallback(async () => {
    if (!vfnTransaction || isPast(vfnTransaction.expireAt)) {
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
    return differenceInMilliseconds(vfnTransaction.expireAt, Date.now())
  }, [vfnTransaction])

  const generateVfnExpiryToast = useCallback(() => {
    if (vfnToastIdRef.current) {
      toast.close(vfnToastIdRef.current)
    }
    const numVerifiable = cachedDto?.form.form_fields.filter((ff) =>
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
  }, [cachedDto?.form.form_fields, toast])

  useTimeout(generateVfnExpiryToast, expiryInMs)

  const handleSubmitForm = useCallback(
    (formInputs: Record<FormFieldDto['_id'], unknown>) => {
      if (!cachedDto?.form) return
      try {
        const responses = cachedDto.form.form_fields
          .map((ff) => transformInputsToOutputs(ff, formInputs[ff._id]))
          .filter((output): output is FieldResponse => output !== undefined)

        return console.log(responses)
      } catch (error) {
        toast({
          status: 'danger',
          description:
            'An error occurred whilst processing your submission. Please refresh and try again.',
        })
      }
    },
    [cachedDto?.form, toast],
  )

  return (
    <PublicFormContext.Provider
      value={{
        miniHeaderRef,
        handleSubmitForm,
        formId,
        error,
        getTransactionId,
        expiryInMs,
        ...cachedDto,
        ...rest,
      }}
    >
      {isFormNotFound ? <div>404</div> : children}
    </PublicFormContext.Provider>
  )
}
