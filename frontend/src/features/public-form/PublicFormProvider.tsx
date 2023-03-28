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
import { useDisclosure } from '@chakra-ui/react'
import { datadogLogs } from '@datadog/browser-logs'
import { differenceInMilliseconds, isPast } from 'date-fns'
import get from 'lodash/get'
import simplur from 'simplur'

import {
  FormAuthType,
  FormResponseMode,
  PublicFormDto,
} from '~shared/types/form'

import { FORMID_REGEX } from '~constants/routes'
import { useTimeout } from '~hooks/useTimeout'
import { useToast } from '~hooks/useToast'
import { HttpError } from '~services/ApiService'
import { FormFieldValues } from '~templates/Field'

import NotFoundErrorPage from '~pages/NotFoundError'
import {
  trackReCaptchaOnError,
  trackSubmitForm,
  trackSubmitFormFailure,
  trackVisitPublicForm,
} from '~features/analytics/AnalyticsService'
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
import { PublicFormContext, SubmissionData } from './PublicFormContext'
import { usePublicFormView } from './queries'
import { axiosDebugFlow } from './utils'

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

  return {
    isNotFormId,
    toast,
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

  const { data: { captchaPublicKey, useFetchForSubmissions } = {} } = useEnv(
    /* enabled= */ !!data?.form.hasCaptcha,
  )
  const { hasLoaded, getCaptchaResponse, containerId } = useRecaptcha({
    sitekey: data?.form.hasCaptcha ? captchaPublicKey : undefined,
  })

  const { isNotFormId, toast, vfnToastIdRef, expiryInMs, ...commonFormValues } =
    useCommonFormProvider(formId)

  useEffect(() => {
    if (data?.myInfoError) {
      toast({
        status: 'danger',
        description:
          'Your Myinfo details could not be retrieved. Refresh your browser and log in, or try again later.',
      })
    }
  }, [data, toast])

  const showErrorToast = useCallback(
    (error, form: PublicFormDto) => {
      toast({
        status: 'danger',
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred whilst processing your submission. Please refresh and try again.',
      })
      trackSubmitFormFailure(form)
    },
    [toast],
  )

  useEffect(() => {
    if (data) trackVisitPublicForm(data.form)
  }, [data])

  const isFormNotFound = useMemo(() => {
    return (
      error instanceof HttpError && (error.code === 404 || error.code === 410)
    )
  }, [error])

  const generateVfnExpiryToast = useCallback(() => {
    if (vfnToastIdRef.current) {
      toast.close(vfnToastIdRef.current)
    }
    const numVerifiable = data?.form.form_fields.filter((ff) =>
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
  }, [data?.form.form_fields, toast, vfnToastIdRef])

  const {
    submitEmailModeFormMutation,
    submitStorageModeFormMutation,
    submitEmailModeFormFetchMutation,
    submitStorageModeFormFetchMutation,
  } = usePublicFormMutations(formId, submissionData?.id ?? '')

  const { handleLogoutMutation } = usePublicAuthMutations(formId)

  const handleSubmitForm: SubmitHandler<FormFieldValues> = useCallback(
    async (formInputs) => {
      const { form } = data ?? {}
      if (!form) return

      let captchaResponse: string | null
      try {
        captchaResponse = await getCaptchaResponse()
      } catch (error) {
        if (error instanceof RecaptchaClosedError) {
          // Do nothing if recaptcha is closed.
          return
        }
        trackReCaptchaOnError(form)
        return showErrorToast(error, form)
      }

      const formData = {
        formFields: form.form_fields,
        formLogics: form.form_logics,
        formInputs,
        captchaResponse,
      }

      const logMeta = {
        action: 'handleSubmitForm',
        useFetchForSubmissions,
      }

      const onSuccess = ({
        submissionId,
        timestamp,
      }: {
        submissionId: string
        timestamp: number
      }) => {
        setSubmissionData({
          id: submissionId,
          timestamp,
        })
        trackSubmitForm(form)
      }

      switch (form.responseMode) {
        case FormResponseMode.Email: {
          // Using mutateAsync so react-hook-form goes into loading state.

          const submitEmailFormWithFetch = function () {
            datadogLogs.logger.info(`handleSubmitForm: submitting via fetch`, {
              meta: {
                ...logMeta,
                responseMode: 'email',
                method: 'fetch',
              },
            })

            return submitEmailModeFormFetchMutation
              .mutateAsync(formData, { onSuccess })
              .catch(async (error) => {
                datadogLogs.logger.warn(`handleSubmitForm: ${error.message}`, {
                  meta: {
                    ...logMeta,
                    responseMode: 'email',
                    method: 'fetch',
                    error: {
                      message: error.message,
                      name: error.name,
                      stack: error.stack,
                    },
                  },
                })
                showErrorToast(error, form)
              })
          }

          // TODO (#5826): Toggle to use fetch for submissions instead of axios. If enabled, this is used for testing and to use fetch instead of axios by default if testing shows fetch is more  stable. Remove once network error is resolved
          if (useFetchForSubmissions) {
            return submitEmailFormWithFetch()
          } else {
            return (
              submitEmailModeFormMutation
                .mutateAsync(formData, { onSuccess })
                // Using catch since we are using mutateAsync and react-hook-form will continue bubbling this up.
                .catch(async (error) => {
                  // TODO(#5826): Remove when we have resolved the Network Error
                  datadogLogs.logger.warn(
                    `handleSubmitForm: ${error.message}`,
                    {
                      meta: {
                        ...logMeta,
                        responseMode: 'email',
                        method: 'axios',
                        error: {
                          message: error.message,
                          stack: error.stack,
                        },
                      },
                    },
                  )
                  if (error.message.match(/Network Error/i)) {
                    axiosDebugFlow()
                    return submitEmailFormWithFetch()
                  } else {
                    showErrorToast(error, form)
                  }
                })
            )
          }
        }
        case FormResponseMode.Encrypt: {
          // Using mutateAsync so react-hook-form goes into loading state.

          const submitStorageFormWithFetch = function () {
            datadogLogs.logger.info(`handleSubmitForm: submitting via fetch`, {
              meta: {
                ...logMeta,
                responseMode: 'storage',
                method: 'fetch',
              },
            })

            return submitStorageModeFormFetchMutation
              .mutateAsync(
                {
                  ...formData,
                  publicKey: form.publicKey,
                },
                {
                  onSuccess,
                },
              )
              .catch(async (error) => {
                datadogLogs.logger.warn(`handleSubmitForm: ${error.message}`, {
                  meta: {
                    ...logMeta,
                    responseMode: 'email',
                    method: 'fetch',
                    error: {
                      message: error.message,
                      name: error.name,
                      stack: error.stack,
                    },
                  },
                })
                showErrorToast(error, form)
              })
          }

          // TODO (#5826): Toggle to use fetch for submissions instead of axios. If enabled, this is used for testing and to use fetch instead of axios by default if testing shows fetch is more  stable. Remove once network error is resolved
          if (useFetchForSubmissions) {
            return submitStorageFormWithFetch()
          } else {
            return (
              submitStorageModeFormMutation
                .mutateAsync(
                  {
                    ...formData,
                    publicKey: form.publicKey,
                  },
                  {
                    onSuccess,
                  },
                )
                // Using catch since we are using mutateAsync and react-hook-form will continue bubbling this up.
                .catch(async (error) => {
                  // TODO(#5826): Remove when we have resolved the Network Error
                  datadogLogs.logger.warn(
                    `handleSubmitForm: ${error.message}`,
                    {
                      meta: {
                        ...logMeta,
                        method: 'axios',
                        error: {
                          message: error.message,
                          stack: error.stack,
                        },
                      },
                    },
                  )

                  if (error.message.match(/Network Error/i)) {
                    axiosDebugFlow()
                    return submitStorageFormWithFetch()
                  } else {
                    showErrorToast(error, form)
                  }
                })
            )
          }
        }
      }
    },
    [
      data,
      getCaptchaResponse,
      showErrorToast,
      submitEmailModeFormMutation,
      submitStorageModeFormMutation,
      submitEmailModeFormFetchMutation,
      submitStorageModeFormFetchMutation,
      useFetchForSubmissions,
    ],
  )

  useTimeout(generateVfnExpiryToast, expiryInMs)

  const handleLogout = useCallback(() => {
    if (!data?.form || data.form.authType === FormAuthType.NIL) return
    return handleLogoutMutation.mutate(data.form.authType)
  }, [data?.form, handleLogoutMutation])

  const isAuthRequired = useMemo(
    () =>
      !!data?.form &&
      data.form.authType !== FormAuthType.NIL &&
      !data.spcpSession,
    [data?.form, data?.spcpSession],
  )

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
        isAuthRequired,
        captchaContainerId: containerId,
        expiryInMs,
        isLoading: isLoading || (!!data?.form.hasCaptcha && !hasLoaded),
        ...commonFormValues,
        ...data,
        ...rest,
      }}
    >
      <Helmet title={isFormNotFound ? 'Form not found' : data?.form.title} />
      {isFormNotFound ? <FormNotFound message={error?.message} /> : children}
    </PublicFormContext.Provider>
  )
}
