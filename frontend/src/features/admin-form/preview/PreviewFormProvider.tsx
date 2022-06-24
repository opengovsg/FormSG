import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Text } from '@chakra-ui/react'
import { differenceInMilliseconds, isPast } from 'date-fns'
import { isEqual } from 'lodash'
import get from 'lodash/get'
import simplur from 'simplur'

import { BasicField } from '~shared/types'
import { FormAuthType, PreviewFormViewDto } from '~shared/types/form'

import { usePreviewForm } from '~/features/admin-form/common/queries'
import { FormNotFound } from '~/features/public-form/components/FormNotFound'
import {
  PublicFormContext,
  SidebarSectionMeta,
  SubmissionData,
} from '~/features/public-form/PublicFormContext'
import { useCommonFormProvider } from '~/features/public-form/PublicFormProvider'

import { useTimeout } from '~hooks/useTimeout'
import { HttpError } from '~services/ApiService'
import Link from '~components/Link'

import NotFoundErrorPage from '~pages/NotFoundError'
import { trackVisitPublicForm } from '~features/analytics/AnalyticsService'
import { useEnv } from '~features/env/queries'
import {
  RecaptchaClosedError,
  useRecaptcha,
} from '~features/recaptcha/useRecaptcha'
import { FetchNewTransactionResponse } from '~features/verifiable-fields'

interface PreviewFormProviderProps {
  formId: string
  children: React.ReactNode
}

export const PreviewFormProvider = ({
  formId,
  children,
}: PreviewFormProviderProps): JSX.Element => {
  // Once form has been submitted, submission data will be set here.
  const [submissionData, setSubmissionData] = useState<SubmissionData>()
  const [vfnTransaction, setVfnTransaction] =
    useState<FetchNewTransactionResponse>()
  const miniHeaderRef = useRef<HTMLDivElement>(null)
  const { data, isLoading, error, ...rest } = usePreviewForm(
    formId,
    // Stop querying once submissionData is present.
    /* enabled= */ !submissionData,
  )
  const { data: { captchaPublicKey } = {} } = useEnv(
    /* enabled= */ !!data?.form.hasCaptcha,
  )
  const { hasLoaded, getCaptchaResponse, containerId } = useRecaptcha({
    sitekey: data?.form.hasCaptcha ? captchaPublicKey : undefined,
  })

  const [cachedDto, setCachedDto] = useState<PreviewFormViewDto>()

  const {
    createTransactionMutation,
    toast,
    vfnToastIdRef,
    desyncToastIdRef,
    isNotFormId,
  } = useCommonFormProvider(formId)

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
  }, [data, cachedDto, toast, desyncToastIdRef])

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
      error instanceof HttpError && (error.code === 404 || error.code === 410)
    )
  }, [error])

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
  }, [cachedDto?.form.form_fields, toast, vfnToastIdRef])

  useTimeout(generateVfnExpiryToast, expiryInMs)

  const showErrorToast = useCallback(() => {
    toast({
      status: 'danger',
      description:
        'An error occurred whilst processing your submission. Please refresh and try again.',
    })
  }, [toast])

  const handleSubmitForm = useCallback(async () => {
    const { form } = cachedDto ?? {}
    if (!form) return

    let captchaResponse: string | null
    try {
      captchaResponse = await getCaptchaResponse()
    } catch (error) {
      if (error instanceof RecaptchaClosedError) {
        // Do nothing if recaptcha is closed.
        return
      }
      return showErrorToast()
    }

    setSubmissionData({ id: 'submissionId', timeInEpochMs: Date.now() })
  }, [cachedDto, getCaptchaResponse, showErrorToast])

  const isAuthRequired = useMemo(
    () => !!cachedDto?.form && cachedDto.form.authType !== FormAuthType.NIL,
    [cachedDto?.form],
  )

  const sectionScrollData = useMemo(() => {
    const { form } = cachedDto ?? {}
    if (!form || isAuthRequired) {
      return []
    }
    const sections: SidebarSectionMeta[] = []
    form.form_fields.forEach((f) => {
      if (f.fieldType !== BasicField.Section) return
      sections.push({
        title: f.title,
        _id: f._id,
      })
    })

    return sections
  }, [cachedDto, isAuthRequired])

  if (isNotFormId) {
    return <NotFoundErrorPage />
  }

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
        sectionScrollData,
        isAuthRequired,
        captchaContainerId: containerId,
        isLoading: isLoading || (!!cachedDto?.form.hasCaptcha && !hasLoaded),
        ...cachedDto,
        ...rest,
      }}
    >
      <Helmet
        title={isFormNotFound ? 'Form not found' : cachedDto?.form.title}
      />
      {isFormNotFound ? <FormNotFound message={error?.message} /> : children}
    </PublicFormContext.Provider>
  )
}
