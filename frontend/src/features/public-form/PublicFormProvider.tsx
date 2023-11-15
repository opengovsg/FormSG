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
import { useNavigate } from 'react-router-dom'
import { useDisclosure } from '@chakra-ui/react'
import { datadogLogs } from '@datadog/browser-logs'
import { differenceInMilliseconds, isPast } from 'date-fns'
import get from 'lodash/get'
import simplur from 'simplur'

import {
  featureFlags,
  PAYMENT_CONTACT_FIELD_ID,
  PAYMENT_PRODUCT_FIELD_ID,
  PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID,
} from '~shared/constants'
import { BasicField, PaymentType } from '~shared/types'
import { CaptchaTypes } from '~shared/types/captcha'
import {
  FormAuthType,
  FormResponseMode,
  ProductItem,
  PublicFormDto,
} from '~shared/types/form'
import { dollarsToCents } from '~shared/utils/payments'

import { MONGODB_ID_REGEX } from '~constants/routes'
import { useBrowserStm } from '~hooks/payments'
import { useTimeout } from '~hooks/useTimeout'
import { useToast } from '~hooks/useToast'
import { HttpError } from '~services/ApiService'
import { FormFieldValues } from '~templates/Field'

import NotFoundErrorPage from '~pages/NotFoundError'
import {
  trackReCaptchaOnError,
  trackSubmitForm,
  trackSubmitFormFailure,
  trackTurnstileOnError,
  trackVisitPublicForm,
} from '~features/analytics/AnalyticsService'
import { useEnv } from '~features/env/queries'
import { useIsFeatureEnabled } from '~features/feature-flags/queries'
import { getPaymentPageUrl } from '~features/public-form/utils/urls'
import {
  RecaptchaClosedError,
  useRecaptcha,
} from '~features/recaptcha/useRecaptcha'
import { useTurnstile } from '~features/turnstile/useTurnstile'
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
  startTime: number
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

  const isNotFormId = useMemo(() => !MONGODB_ID_REGEX.test(formId), [formId])

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
  startTime,
}: PublicFormProviderProps): JSX.Element => {
  // Once form has been submitted, submission data will be set here.
  const [submissionData, setSubmissionData] = useState<SubmissionData>()
  const [numVisibleFields, setNumVisibleFields] = useState(0)

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

  // Only load catpcha if enabled on form and the user is not on GSIB
  const enableCaptcha = data && data.form.hasCaptcha && !data.isIntranetUser

  const {
    data: { captchaPublicKey, turnstileSiteKey, useFetchForSubmissions } = {},
  } = useEnv(/* enabled= */ enableCaptcha)

  // Feature flag to control turnstile captcha rollout
  // defaults to false
  // todo: remove after full rollout
  const enableTurnstileFeatureFlag = useIsFeatureEnabled(
    featureFlags.turnstile,
    false,
  )

  let hasLoaded: boolean
  let containerID: string
  let captchaType: CaptchaTypes

  const {
    hasLoaded: hasTurnstileLoaded,
    getTurnstileResponse,
    containerID: turnstileContainerID,
  } = useTurnstile({
    sitekey: enableCaptcha ? turnstileSiteKey : undefined,
    enableUsage: enableTurnstileFeatureFlag,
  })

  const {
    hasLoaded: hasRecaptchaLoaded,
    getCaptchaResponse,
    containerId: recaptchaContainerID,
  } = useRecaptcha({
    sitekey: enableCaptcha ? captchaPublicKey : undefined,
    enableUsage: !enableTurnstileFeatureFlag,
  })

  if (enableTurnstileFeatureFlag) {
    hasLoaded = hasTurnstileLoaded
    containerID = turnstileContainerID
    captchaType = CaptchaTypes.Turnstile
  } else {
    hasLoaded = hasRecaptchaLoaded
    containerID = recaptchaContainerID
    captchaType = CaptchaTypes.Recaptcha
  }

  const { isNotFormId, toast, vfnToastIdRef, expiryInMs, ...commonFormValues } =
    useCommonFormProvider(formId)

  const isPaymentEnabled =
    data?.form.responseMode === FormResponseMode.Encrypt &&
    data.form.payments_field.enabled

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
    submitEmailModeFormFetchMutation,
    submitStorageModeFormWithVirusScanningFetchMutation,
    submitStorageModeFormWithVirusScanningMutation,
  } = usePublicFormMutations(formId, submissionData?.id ?? '')

  const { handleLogoutMutation } = usePublicAuthMutations(formId)

  const navigate = useNavigate()
  const [, storePaymentMemory] = useBrowserStm(formId)
  const handleSubmitForm: SubmitHandler<FormFieldValues> = useCallback(
    async ({
      [PAYMENT_CONTACT_FIELD_ID]: paymentReceiptEmailField,
      [PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID]: paymentVariableInputAmountField,
      [PAYMENT_PRODUCT_FIELD_ID]: paymentProducts,
      ...formInputs
    }) => {
      const { form } = data ?? {}
      if (!form) return

      let captchaResponse: string | null

      if (enableTurnstileFeatureFlag) {
        try {
          captchaResponse = await getTurnstileResponse()
        } catch (error) {
          trackTurnstileOnError(form)
          return showErrorToast(error, form)
        }
      } else {
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
      }

      const countryRegionFieldIds = new Set(
        form.form_fields
          .filter((field) => field.fieldType === BasicField.CountryRegion)
          .map((field) => field._id),
      )
      // We want users to see the country/region options in title-case but we also need the data in the backend to remain in upper-case.
      // Country/region data in the backend needs to remain in upper-case so that they remain consistent with myinfo-countries.
      const formInputsWithCountryRegionInUpperCase = Object.keys(
        formInputs,
      ).reduce((newFormInputs: typeof formInputs, fieldId) => {
        const currentInput = formInputs[fieldId]
        if (
          countryRegionFieldIds.has(fieldId) &&
          typeof currentInput === 'string'
        ) {
          newFormInputs[fieldId] = currentInput.toUpperCase()
        } else {
          newFormInputs[fieldId] = currentInput
        }
        return newFormInputs
      }, {})

      const formData = {
        formFields: form.form_fields,
        formLogics: form.form_logics,
        formInputs: formInputsWithCountryRegionInUpperCase,
        captchaResponse,
        captchaType,
        responseMetadata: {
          responseTimeMs: differenceInMilliseconds(Date.now(), startTime),
          numVisibleFields: isPaymentEnabled
            ? numVisibleFields + 1
            : numVisibleFields,
        },
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
              .mutateAsync(
                {
                  ...formData,
                  formInputs: formInputsWithCountryRegionInUpperCase,
                },
                { onSuccess },
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
            return submitEmailFormWithFetch()
          } else {
            datadogLogs.logger.info(`handleSubmitForm: submitting via axios`, {
              meta: {
                ...logMeta,
                responseMode: 'email',
                method: 'axios',
              },
            })

            return (
              submitEmailModeFormMutation
                .mutateAsync(
                  {
                    ...formData,
                    formInputs: formInputsWithCountryRegionInUpperCase,
                  },
                  { onSuccess },
                )
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
                  if (/Network Error/i.test(error.message)) {
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

          const formPaymentData: {
            paymentReceiptEmail: string | undefined
            paymentProducts: Array<ProductItem> | undefined
            payments?: { amount_cents: number } | undefined
          } = {
            paymentReceiptEmail: paymentReceiptEmailField?.value,
            paymentProducts: paymentProducts?.filter<ProductItem>(
              (product): product is ProductItem =>
                product.selected && product.quantity > 0,
            ),
            ...(form.payments_field.payment_type === PaymentType.Variable
              ? {
                  payments: {
                    amount_cents: dollarsToCents(
                      paymentVariableInputAmountField ?? '0',
                    ),
                  },
                }
              : {}),
          }

          const submitStorageFormWithFetch = function () {
            datadogLogs.logger.info(`handleSubmitForm: submitting via fetch`, {
              meta: {
                ...logMeta,
                responseMode: 'storage',
                method: 'fetch',
              },
            })

            return submitStorageModeFormWithVirusScanningFetchMutation
              .mutateAsync(
                {
                  ...formData,
                  ...formPaymentData,
                },
                {
                  onSuccess: ({
                    submissionId,
                    timestamp,
                    // payment forms will have non-empty paymentData field
                    paymentData,
                  }) => {
                    trackSubmitForm(form)

                    if (paymentData) {
                      navigate(getPaymentPageUrl(formId, paymentData.paymentId))
                      storePaymentMemory(paymentData.paymentId)
                      return
                    }
                    setSubmissionData({
                      id: submissionId,
                      timestamp,
                    })
                  },
                },
              )
              .catch(async (error) => {
                datadogLogs.logger.warn(`handleSubmitForm: ${error.message}`, {
                  meta: {
                    ...logMeta,
                    responseMode: 'storage',
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
          }
          datadogLogs.logger.info(`handleSubmitForm: submitting via axios`, {
            meta: {
              ...logMeta,
              responseMode: 'storage',
              method: 'axios',
            },
          })

          return submitStorageModeFormWithVirusScanningMutation
            .mutateAsync(
              {
                ...formData,
                ...formPaymentData,
              },
              {
                onSuccess: ({
                  submissionId,
                  timestamp,
                  // payment forms will have non-empty paymentData field
                  paymentData,
                }) => {
                  trackSubmitForm(form)

                  if (paymentData) {
                    navigate(getPaymentPageUrl(formId, paymentData.paymentId))
                    storePaymentMemory(paymentData.paymentId)
                    return
                  }
                  setSubmissionData({
                    id: submissionId,
                    timestamp,
                  })
                },
              },
            )
            .catch(async (error) => {
              datadogLogs.logger.warn(
                `handleSubmitForm: submit with virus scan`,
                {
                  meta: {
                    ...logMeta,
                    responseMode: 'storage',
                    method: 'axios',
                    error,
                  },
                },
              )
              if (/Network Error/i.test(error.message)) {
                axiosDebugFlow()
                // fallback to fetch
                return submitStorageFormWithFetch()
              }
              showErrorToast(error, form)
            })
        }
      }
    },
    [
      data,
      enableTurnstileFeatureFlag,
      captchaType,
      startTime,
      isPaymentEnabled,
      numVisibleFields,
      useFetchForSubmissions,
      getTurnstileResponse,
      showErrorToast,
      getCaptchaResponse,
      submitEmailModeFormFetchMutation,
      submitEmailModeFormMutation,
      submitStorageModeFormWithVirusScanningMutation,
      submitStorageModeFormWithVirusScanningFetchMutation,
      navigate,
      formId,
      storePaymentMemory,
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
        captchaContainerId: containerID,
        expiryInMs,
        isLoading: isLoading || (!!enableCaptcha && !hasLoaded),
        isPaymentEnabled,
        isPreview: false,
        setNumVisibleFields,
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
