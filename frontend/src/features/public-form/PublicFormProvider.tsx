import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Text } from '@chakra-ui/react'
import { differenceInMilliseconds, isPast } from 'date-fns'
import { isEqual } from 'lodash'
import get from 'lodash/get'
import simplur from 'simplur'

import { FormFieldDto } from '~shared/types/field'
import { FormResponseMode, PublicFormViewDto } from '~shared/types/form'

import { PUBLICFORM_REGEX } from '~constants/routes'
import { useTimeout } from '~hooks/useTimeout'
import { useToast } from '~hooks/useToast'
import { HttpError } from '~services/ApiService'
import Link from '~components/Link'

import { trackVisitPublicForm } from '~features/analytics/AnalyticsService'
import {
  FetchNewTransactionResponse,
  useTransactionMutations,
} from '~features/verifiable-fields'

import { usePublicFormMutations } from './mutations'
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
  // Once form has been submitted, submission ID will be set here.
  const [submissionId, setSubmissionId] = useState<string>()
  const [vfnTransaction, setVfnTransaction] =
    useState<FetchNewTransactionResponse>()
  const miniHeaderRef = useRef<HTMLDivElement>(null)
  const { data, error, ...rest } = usePublicFormView(
    formId,
    // Stop querying once submissionId is present.
    /* enabled= */ !submissionId,
  )

  const [cachedDto, setCachedDto] = useState<PublicFormViewDto>()

  const { createTransactionMutation } = useTransactionMutations(formId)
  const { submitEmailModeFormMutation } = usePublicFormMutations(formId)
  const toast = useToast()
  const vfnToastIdRef = useRef<string | number>()
  const desyncToastIdRef = useRef<string | number>()

  useEffect(() => {
    if (data) {
      if (!cachedDto) {
        trackVisitPublicForm(data.form)
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
    async (formInputs: Record<FormFieldDto['_id'], unknown>) => {
      const { form } = cachedDto ?? {}
      if (!form) return
      switch (form.responseMode) {
        case FormResponseMode.Email:
          // Using mutateAsync so react-hook-form goes into loading state.
          return submitEmailModeFormMutation
            .mutateAsync(
              {
                formFields: form.form_fields,
                formInputs,
              },
              {
                onSuccess: ({ submissionId }) => setSubmissionId(submissionId),
              },
            )
            .catch(() => {
              // Using catch since we are using mutateAsync and react-hook-form will continue bubbling this up.
              toast({
                status: 'danger',
                description:
                  'An error occurred whilst processing your submission. Please refresh and try again.',
              })
            })
        case FormResponseMode.Encrypt:
          return console.log('encrypt mode TODO')
      }
    },
    [cachedDto, submitEmailModeFormMutation, toast],
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
      <Helmet title={cachedDto?.form.title} />
      {isFormNotFound ? <div>404</div> : children}
    </PublicFormContext.Provider>
  )
}
