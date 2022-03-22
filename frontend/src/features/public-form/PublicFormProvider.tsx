import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Text } from '@chakra-ui/react'
import { differenceInMilliseconds, isPast } from 'date-fns'
import { isEqual } from 'lodash'
import get from 'lodash/get'
import simplur from 'simplur'

import { FormFieldDto } from '~shared/types/field'
import {
  FormColorTheme,
  FormResponseMode,
  PublicFormViewDto,
} from '~shared/types/form'
import { SubmissionResponseDto } from '~shared/types/submission'

import { PUBLICFORM_REGEX } from '~constants/routes'
import { useTimeout } from '~hooks/useTimeout'
import { useToast } from '~hooks/useToast'
import { HttpError } from '~services/ApiService'
import Link from '~components/Link'

import { useEnv } from '~features/env/queries'
import { useRecaptcha } from '~features/recaptcha/useRecaptcha'
import {
  FetchNewTransactionResponse,
  useTransactionMutations,
} from '~features/verifiable-fields'

import { usePublicFormMutations } from './mutations'
import { PublicFormContext, SubmissionData } from './PublicFormContext'
import { SubmitEmailFormArgs } from './PublicFormService'
import { usePublicFormView } from './queries'
import { createResponsesArray } from './utils'

interface PublicFormProviderProps {
  formId: string
  children: React.ReactNode
}

export const PublicFormProvider = ({
  formId,
  children,
}: PublicFormProviderProps): JSX.Element => {
  // Once form has been submitted, submission ID will be set here.
  const [submissionData, setSubmissionData] = useState<SubmissionData>()
  const [vfnTransaction, setVfnTransaction] =
    useState<FetchNewTransactionResponse>()
  const miniHeaderRef = useRef<HTMLDivElement>(null)
  const { data, isLoading, error, ...rest } = usePublicFormView(
    formId,
    // Stop querying once submissionId is present.
    /* enabled= */ !submissionData?.id,
  )
  const { data: { captchaPublicKey } = {} } = useEnv(!!data?.form.hasCaptcha)
  const { hasLoaded, getCaptchaResponse, containerId } = useRecaptcha({
    sitekey: captchaPublicKey,
  })

  const [cachedDto, setCachedDto] = useState<PublicFormViewDto>()

  const { createTransactionMutation } = useTransactionMutations(formId)
  const { submitEmailModeFormMutation, submitStorageModeFormMutation } =
    usePublicFormMutations(formId)
  const toast = useToast()
  const vfnToastIdRef = useRef<string | number>()
  const desyncToastIdRef = useRef<string | number>()

  const formBgColor = useMemo(() => {
    if (isLoading) return 'neutral.100'
    if (!cachedDto) return ''
    const { colorTheme } = cachedDto.form.startPage
    switch (colorTheme) {
      case FormColorTheme.Blue:
        return 'secondary.100'
      default:
        return `theme-${colorTheme}.100`
    }
  }, [cachedDto, isLoading])

  useEffect(() => {
    if (data) {
      if (!cachedDto) {
        setCachedDto(data)
      } else if (
        !submissionData &&
        !desyncToastIdRef.current &&
        !isEqual(data, cachedDto)
      ) {
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
  }, [data, cachedDto, toast, submissionData])

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

  const showErrorToast = useCallback(() => {
    toast({
      status: 'danger',
      description:
        'An error occurred whilst processing your submission. Please refresh and try again.',
    })
  }, [toast])

  const handleSubmitSuccess = useCallback(
    (
      { submissionId }: SubmissionResponseDto,
      { formFields, formInputs }: Omit<SubmitEmailFormArgs, 'formId'>,
    ) => {
      const submission = createResponsesArray(formFields, formInputs)
      setSubmissionData({
        id: submissionId,
        submission,
        timeInEpochMs: Date.now(),
      })
    },
    [],
  )

  const handleSubmitForm = useCallback(
    async (formInputs: Record<FormFieldDto['_id'], unknown>) => {
      const { form } = cachedDto ?? {}
      if (!form) return

      let captchaResponse: string | null
      try {
        captchaResponse = await getCaptchaResponse()
      } catch {
        return showErrorToast()
      }

      switch (form.responseMode) {
        case FormResponseMode.Email:
          // Using mutateAsync so react-hook-form goes into loading state.
          return (
            submitEmailModeFormMutation
              .mutateAsync(
                { formFields: form.form_fields, formInputs, captchaResponse },
                { onSuccess: handleSubmitSuccess },
              )
              // Using catch since we are using mutateAsync and react-hook-form will continue bubbling this up.
              .catch(showErrorToast)
          )
        case FormResponseMode.Encrypt:
          // Using mutateAsync so react-hook-form goes into loading state.
          return (
            submitStorageModeFormMutation
              .mutateAsync(
                {
                  formFields: form.form_fields,
                  formInputs,
                  publicKey: form.publicKey,
                  captchaResponse,
                },
                { onSuccess: handleSubmitSuccess },
              )
              // Using catch since we are using mutateAsync and react-hook-form will continue bubbling this up.
              .catch(showErrorToast)
          )
      }
    },
    [
      cachedDto,
      getCaptchaResponse,
      handleSubmitSuccess,
      showErrorToast,
      submitEmailModeFormMutation,
      submitStorageModeFormMutation,
    ],
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
        submissionData,
        formBgColor,
        captchaContainerId: containerId,
        isLoading: isLoading || (!!cachedDto?.form.hasCaptcha && !hasLoaded),
        ...cachedDto,
        ...rest,
      }}
    >
      {isFormNotFound ? <div>404</div> : children}
    </PublicFormContext.Provider>
  )
}
