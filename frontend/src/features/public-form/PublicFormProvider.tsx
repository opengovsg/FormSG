import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Helmet } from 'react-helmet-async'
import { SubmitHandler } from 'react-hook-form'
import { Text, useDisclosure } from '@chakra-ui/react'
import { differenceInMilliseconds, isPast } from 'date-fns'
import { isEqual } from 'lodash'
import get from 'lodash/get'
import simplur from 'simplur'

import { BasicField } from '~shared/types'
import {
  FormAuthType,
  FormResponseMode,
  PublicFormViewDto,
} from '~shared/types/form'

import { FORMID_REGEX } from '~constants/routes'
import { useTimeout } from '~hooks/useTimeout'
import { useToast } from '~hooks/useToast'
import { HttpError } from '~services/ApiService'
import Link from '~components/Link'
import { FormFieldValues } from '~templates/Field'

import NotFoundErrorPage from '~pages/NotFoundError'
import { trackVisitPublicForm } from '~features/analytics/AnalyticsService'
import { useEnv } from '~features/env/queries'
import {
  RecaptchaClosedError,
  useRecaptcha,
} from '~features/recaptcha/useRecaptcha'
import {
  FetchNewTransactionResponse,
  useTransactionMutations,
} from '~features/verifiable-fields'

import { FormNotFound } from './components/FormNotFound'
import { usePublicAuthMutations, usePublicFormMutations } from './mutations'
import {
  PublicFormContext,
  SidebarSectionMeta,
  SubmissionData,
} from './PublicFormContext'
import { usePublicFormView } from './queries'

interface PublicFormProviderProps {
  formId: string
  children: React.ReactNode
}

export function useCommonFormProvider(formId: string) {
  // For mobile section sidebar
  const {
    isOpen: isMobileDrawerOpen,
    onOpen: onMobileDrawerOpen,
    onClose: onMobileDrawerClose,
  } = useDisclosure()

  const [vfnTransaction, setVfnTransaction] =
    useState<FetchNewTransactionResponse>()
  const miniHeaderRef = useRef<HTMLDivElement>(null)
  const { createTransactionMutation } = useTransactionMutations(formId)
  const toast = useToast({ isClosable: true })
  const vfnToastIdRef = useRef<string | number>()
  const desyncToastIdRef = useRef<string | number>()

  const getTransactionId = useCallback(async () => {
    if (!vfnTransaction || isPast(vfnTransaction.expireAt)) {
      const result = await createTransactionMutation.mutateAsync()
      setVfnTransaction(result)
      return result.transactionId
    }
    return vfnTransaction.transactionId
  }, [createTransactionMutation, vfnTransaction])

  const isNotFormId = useMemo(() => !FORMID_REGEX.test(formId), [formId])

  const expiryInMs = useMemo(() => {
    if (!vfnTransaction?.expireAt) return null
    return differenceInMilliseconds(vfnTransaction.expireAt, Date.now())
  }, [vfnTransaction])

  const showErrorToast = useCallback(() => {
    toast({
      status: 'danger',
      description:
        'An error occurred whilst processing your submission. Please refresh and try again.',
    })
  }, [toast])

  return {
    isNotFormId,
    toast,
    showErrorToast,
    desyncToastIdRef,
    vfnToastIdRef,
    expiryInMs,
    miniHeaderRef,
    getTransactionId,
    isMobileDrawerOpen,
    onMobileDrawerOpen,
    onMobileDrawerClose,
  }
}

export const PublicFormProvider = ({
  formId,
  children,
}: PublicFormProviderProps): JSX.Element => {
  // Once form has been submitted, submission data will be set here.
  const [submissionData, setSubmissionData] = useState<SubmissionData>()

  const { data, isLoading, error, ...rest } = usePublicFormView(
    formId,
    // Stop querying once submissionData is present.
    /* enabled= */ !submissionData,
  )

  // Scroll to top of page when user has finished their submission.
  useLayoutEffect(() => {
    if (submissionData) {
      window.scrollTo(0, 0)
    }
  }, [submissionData])

  const { data: { captchaPublicKey } = {} } = useEnv(
    /* enabled= */ !!data?.form.hasCaptcha,
  )
  const { hasLoaded, getCaptchaResponse, containerId } = useRecaptcha({
    sitekey: data?.form.hasCaptcha ? captchaPublicKey : undefined,
  })

  const [cachedDto, setCachedDto] = useState<PublicFormViewDto>()

  const {
    isNotFormId,
    toast,
    showErrorToast,
    desyncToastIdRef,
    vfnToastIdRef,
    expiryInMs,
    ...commonFormValues
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
              <Link href={window.location.href}>Refresh</Link> for the latest
              version of the form.
            </Text>
          ),
          duration: null,
        })
      }
    }
  }, [data, cachedDto, toast, desyncToastIdRef])

  const isFormNotFound = useMemo(() => {
    return (
      error instanceof HttpError && (error.code === 404 || error.code === 410)
    )
  }, [error])

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

  const { submitEmailModeFormMutation, submitStorageModeFormMutation } =
    usePublicFormMutations(formId, submissionData?.id ?? '')

  const { handleLogoutMutation } = usePublicAuthMutations(formId)

  const handleSubmitForm: SubmitHandler<FormFieldValues> = useCallback(
    async (formInputs) => {
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

      switch (form.responseMode) {
        case FormResponseMode.Email:
          // Using mutateAsync so react-hook-form goes into loading state.
          return (
            submitEmailModeFormMutation
              .mutateAsync(
                { formFields: form.form_fields, formInputs, captchaResponse },
                {
                  onSuccess: ({ submissionId }) =>
                    setSubmissionData({
                      id: submissionId,
                      // TODO: Server should return server time so browser time is not used.
                      timeInEpochMs: Date.now(),
                    }),
                },
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
                {
                  onSuccess: ({ submissionId }) =>
                    setSubmissionData({
                      id: submissionId,
                      // TODO: Server should return server time so browser time is not used.
                      timeInEpochMs: Date.now(),
                    }),
                },
              )
              // Using catch since we are using mutateAsync and react-hook-form will continue bubbling this up.
              .catch(showErrorToast)
          )
      }
    },
    [
      cachedDto,
      getCaptchaResponse,
      showErrorToast,
      submitEmailModeFormMutation,
      submitStorageModeFormMutation,
    ],
  )

  useTimeout(generateVfnExpiryToast, expiryInMs)

  const handleLogout = useCallback(() => {
    if (!cachedDto?.form || cachedDto.form.authType === FormAuthType.NIL) return
    return handleLogoutMutation.mutate(cachedDto.form.authType)
  }, [cachedDto?.form, handleLogoutMutation])

  const isAuthRequired = useMemo(
    () =>
      !!cachedDto?.form &&
      cachedDto.form.authType !== FormAuthType.NIL &&
      !cachedDto.spcpSession,
    [cachedDto?.form, cachedDto?.spcpSession],
  )

  const sectionScrollData = useMemo(() => {
    const { form } = cachedDto ?? {}
    if (!form || isAuthRequired) {
      return []
    }
    const sections: SidebarSectionMeta[] = []
    if (form.startPage.paragraph)
      sections.push({
        title: 'Instructions',
        _id: 'instructions',
      })
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
        handleSubmitForm,
        handleLogout,
        formId,
        error,
        submissionData,
        sectionScrollData,
        isAuthRequired,
        captchaContainerId: containerId,
        expiryInMs,
        isLoading: isLoading || (!!cachedDto?.form.hasCaptcha && !hasLoaded),
        ...commonFormValues,
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
