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
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDisclosure } from '@chakra-ui/react'
import { datadogLogs } from '@datadog/browser-logs'
import { useGrowthBook } from '@growthbook/growthbook-react'
import { differenceInMilliseconds, isPast } from 'date-fns'
import { flow } from 'lodash'
import get from 'lodash/get'

import {
  featureFlags,
  PAYMENT_CONTACT_FIELD_ID,
  PAYMENT_PRODUCT_FIELD_ID,
  PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID,
} from '~shared/constants'
import { BasicField, PaymentType } from '~shared/types'
import { CaptchaTypes } from '~shared/types/captcha'
import { ErrorCode } from '~shared/types/errorCodes'
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
import { isKeypairValid } from '~utils/secretKeyValidation'
import {
  HttpError,
  SingleSubmissionValidationError,
} from '~services/ApiService'
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
import { decryptAttachment, decryptSubmission } from './utils/decryptSubmission'
import { usePublicAuthMutations, usePublicFormMutations } from './mutations'
import { PublicFormContext, SubmissionData } from './PublicFormContext'
import { useEncryptedSubmission, usePublicFormView } from './queries'
import { axiosDebugFlow } from './utils'

interface PublicFormProviderProps {
  formId: string
  submissionId?: string
  startTime: number
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

// Country/region data must be upper-case in backend for myinfo-countries compatibility,
// while displaying in title-case to users in the frontend.
// Hence, we need to map the frontend title-case to upper-case when submitting to backend.
const transformFormInputCountryRegionToUpperCase =
  (form_fields: Array<{ fieldType: BasicField; _id: string }>) =>
  (formInputs: Record<string, unknown>) => {
    const countryRegionFieldIds = new Set(
      form_fields
        .filter((field) => field.fieldType === BasicField.CountryRegion)
        .map((field) => field._id),
    )

    return Object.keys(formInputs).reduce(
      (newFormInputs: typeof formInputs, fieldId) => {
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
      },
      {},
    )
  }

// Trim text inputs before sending to backend to match frontend validation
const transformFormInputTrimTextInputs =
  (form_fields: Array<{ fieldType: BasicField; _id: string }>) =>
  (formInputs: Record<string, unknown>) => {
    const textFieldIds = new Set(
      form_fields
        .filter(
          (field) =>
            field.fieldType === BasicField.ShortText ||
            field.fieldType === BasicField.LongText,
        )
        .map((field) => field._id),
    )

    return Object.keys(formInputs).reduce(
      (newFormInputs: typeof formInputs, fieldId) => {
        const currentInput = formInputs[fieldId]
        if (textFieldIds.has(fieldId) && typeof currentInput === 'string') {
          newFormInputs[fieldId] = currentInput.trim()
        } else {
          newFormInputs[fieldId] = currentInput
        }
        return newFormInputs
      },
      {},
    )
  }

export const PublicFormProvider = ({
  formId,
  submissionId: previousSubmissionId,
  children,
  startTime,
}: PublicFormProviderProps): JSX.Element => {
  const { t } = useTranslation()

  // Once form has been submitted, submission data will be set here.
  const [submissionData, setSubmissionData] = useState<SubmissionData>()

  const {
    data,
    isLoading: isFormLoading,
    error: publicFormError,
    ...rest
  } = usePublicFormView(
    formId,
    // Stop querying once submissionData is present.
    /* enabled= */ !submissionData,
  )

  const [numVisibleFields, setNumVisibleFields] = useState(0)

  // Respondent access error states
  const [
    hasSingleSubmissionValidationError,
    setHasSingleSubmissionValidationError,
  ] = useState(false)
  const [
    hasRespondentNotWhitelistedError,
    setHasRespondentNotWhitelistedError,
  ] = useState(false)

  const clearRespondentAccessErrors = useCallback(() => {
    setHasRespondentNotWhitelistedError(false)
    setHasSingleSubmissionValidationError(false)
  }, [])

  const [
    hasPreviousSubmissionDecryptionError,
    setHasPreviousSubmissionDecryptionError,
  ] = useState(false)

  useEffect(() => {
    if (
      data?.errorCodes?.find(
        (errorCode) =>
          errorCode === ErrorCode.respondentSingleSubmissionValidationFailure,
      )
    ) {
      setHasSingleSubmissionValidationError(true)
    }

    if (
      data?.errorCodes?.find(
        (errorCode) => errorCode === ErrorCode.respondentNotWhitelisted,
      )
    ) {
      setHasRespondentNotWhitelistedError(true)
    }
  }, [data?.errorCodes])

  const { isNotFormId, toast, vfnToastIdRef, expiryInMs, ...commonFormValues } =
    useCommonFormProvider(formId)

  const {
    data: encryptedPreviousSubmission,
    isLoading: isSubmissionLoading,
    error: encryptedSubmissionError,
  } = useEncryptedSubmission(
    formId,
    previousSubmissionId,
    // Stop querying once submissionData is present.
    /* enabled= */ !submissionData,
  )

  const isLoading = isFormLoading || isSubmissionLoading
  const error = publicFormError || encryptedSubmissionError

  const [previousSubmission, setPreviousSubmission] =
    useState<ReturnType<typeof decryptSubmission>>()
  const [isSubmissionSecretKeyInvalid, setIsSubmissionSecretKeyInvalid] =
    useState(false)

  const [previousAttachments, setPreviousAttachments] = useState<
    Record<string, ArrayBuffer>
  >({})

  const [searchParams] = useSearchParams()

  // MRF key
  let submissionSecretKey = ''
  try {
    submissionSecretKey = decodeURIComponent(searchParams.get('key') ?? '')
  } catch (e) {
    console.log(e)
  }

  useEffect(() => {
    // Function to decrypt attachments retrieved from S3 using the submission secret key
    const decryptAttachments = async () => {
      const decryptedAttachments: Record<string, Uint8Array> = {}
      if (!encryptedPreviousSubmission) return
      const isValid = isKeypairValid(
        encryptedPreviousSubmission.submissionPublicKey,
        submissionSecretKey,
      )
      if (!isValid) return

      const decryptionTasks = Object.keys(
        encryptedPreviousSubmission.encryptedAttachments,
      ).map(async (id) => {
        const attachment = encryptedPreviousSubmission.encryptedAttachments[id]
        let decryptedContent
        try {
          decryptedContent = await decryptAttachment(
            attachment,
            submissionSecretKey,
          )
        } catch (e) {
          console.error(e, 'failed to decrypt attachment', id)
          setHasPreviousSubmissionDecryptionError(true)
        }
        if (!decryptedContent) return

        decryptedAttachments[id] = decryptedContent
      })
      await Promise.all(decryptionTasks)
      setPreviousAttachments(decryptedAttachments)
    }

    if (encryptedPreviousSubmission?.mrfVersion === 1) {
      if (submissionSecretKey) decryptAttachments()
    } else {
      // Backward compatibility to retrieve attachments from the DB itself once
      // the previous submission responses are decrypted.
      if (previousSubmission) {
        // Backward compatibility
        const previousAttachments: Record<string, ArrayBuffer> = {}
        Object.keys(previousSubmission.responses).forEach((id) => {
          const response = previousSubmission.responses[id]
          if (response.fieldType === BasicField.Attachment) {
            previousAttachments[id] = Uint8Array.from(
              //@ts-expect-error 'content' required for backward compatibility, but
              // does not exist on AttachmentFieldResponseV3 in mrfVersion === 1 versions
              response.answer.content.data,
            )
          }
        })
        setPreviousAttachments(previousAttachments)
      }
    }
  }, [encryptedPreviousSubmission, previousSubmission, submissionSecretKey])

  if (
    previousSubmissionId &&
    encryptedPreviousSubmission &&
    !previousSubmission &&
    !isSubmissionSecretKeyInvalid
  ) {
    const isValid = isKeypairValid(
      encryptedPreviousSubmission.submissionPublicKey,
      submissionSecretKey,
    )

    if (isValid) {
      setPreviousSubmission(
        decryptSubmission({
          submission: encryptedPreviousSubmission,
          secretKey: submissionSecretKey,
        }),
      )
    } else {
      setIsSubmissionSecretKeyInvalid(true)
    }
  }

  // Replace form fields, logic, and workflow with the previous version for MRF consistency.
  if (data && encryptedPreviousSubmission) {
    data.form.form_fields = encryptedPreviousSubmission.form_fields
    data.form.form_logics = encryptedPreviousSubmission.form_logics
    if (data.form.responseMode === FormResponseMode.Multirespondent) {
      data.form.workflow = encryptedPreviousSubmission.workflow
    }
  }

  const growthbook = useGrowthBook()

  useEffect(() => {
    if (growthbook) {
      growthbook.setAttributes({
        // Only update the `formId` attribute, keep the rest the same
        ...growthbook.getAttributes(),
        formId,
      })
    }
  }, [growthbook, formId])

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

  const isPaymentEnabled =
    data?.form.responseMode === FormResponseMode.Encrypt &&
    data.form.payments_field.enabled

  const hasMyInfoError = !!data?.errorCodes?.find(
    (errorCode) => errorCode === ErrorCode.myInfo,
  )

  useEffect(() => {
    if (hasMyInfoError) {
      toast({
        status: 'danger',
        description: t('features.publicForm.errors.myinfo'),
      })
    }
    if (hasPreviousSubmissionDecryptionError) {
      toast({
        status: 'danger',
        description: 'Failed to decrypt attachment',
      })
    }
  }, [hasMyInfoError, hasPreviousSubmissionDecryptionError, toast, t])

  const showErrorToast = useCallback(
    (error: unknown, form: PublicFormDto) => {
      toast({
        status: 'danger',
        description:
          error instanceof Error
            ? error.message
            : t('features.publicForm.errors.submitFailure'),
      })
      trackSubmitFormFailure(form)
    },
    [toast, t],
  )

  useEffect(() => {
    if (data) trackVisitPublicForm(data.form)
  }, [data])

  const formNotFoundMessage = useMemo(() => {
    // Server response 404 or 410
    const isFormNotFound =
      error instanceof HttpError && (error.code === 404 || error.code === 410)

    // Non MRFs should not use the :formId/edit/:submissionId path
    const isNonMultirespondentFormWithPreviousSubmissionId =
      !!data &&
      data.form.responseMode !== FormResponseMode.Multirespondent &&
      !!previousSubmissionId

    if (isFormNotFound || isNonMultirespondentFormWithPreviousSubmissionId) {
      const title = t('features.publicForm.errors.notFound')
      return {
        title,
        header: t('features.publicForm.errors.notAvailable'),
        message: error?.message ?? title,
      }
    }

    // Decryption failed for previous submission
    if (isSubmissionSecretKeyInvalid) {
      return t('features.publicForm.errors.submissionSecretKeyInvalid')
    }
  }, [error, data, previousSubmissionId, isSubmissionSecretKeyInvalid, t])

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
        description: t('features.publicForm.errors.verifiedFieldExpired'),
      })
    }
  }, [data?.form.form_fields, toast, vfnToastIdRef, t])

  const {
    submitEmailModeFormMutation,
    submitEmailModeFormFetchMutation,
    submitStorageModeFormMutation,
    submitStorageModeFormFetchMutation,
    submitMultirespondentFormMutation,
    updateMultirespondentSubmissionMutation,
  } = usePublicFormMutations(
    formId,
    previousSubmissionId,
    previousSubmission?.submissionSecretKey,
  )

  const { handleLogoutMutation } = usePublicAuthMutations(formId)

  const handleLogout = useCallback(() => {
    if (!data?.form || data.form.authType === FormAuthType.NIL) return
    return handleLogoutMutation.mutate(data.form.authType)
  }, [data?.form, handleLogoutMutation])

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

      const transformedFormInputs = flow([
        transformFormInputCountryRegionToUpperCase(form.form_fields),
        transformFormInputTrimTextInputs(form.form_fields),
      ])(formInputs) as typeof formInputs

      const formData = {
        formFields: form.form_fields,
        formLogics: form.form_logics,
        formInputs: transformedFormInputs,
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
        if (
          data &&
          form.isSingleSubmission &&
          form.authType !== FormAuthType.NIL
        ) {
          data.spcpSession = undefined
        }
        setSubmissionData({
          id: submissionId,
          timestamp,
        })
        trackSubmitForm(form)
      }

      const handleError = (error: Error, form: PublicFormDto) => {
        if (error instanceof SingleSubmissionValidationError) {
          setHasSingleSubmissionValidationError(true)
        } else {
          showErrorToast(error, form)
        }
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
                  formInputs: transformedFormInputs,
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
                handleError(error, form)
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
                    formInputs: transformedFormInputs,
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
                    handleError(error, form)
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

            return submitStorageModeFormFetchMutation
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
                    if (
                      data &&
                      form.isSingleSubmission &&
                      form.authType !== FormAuthType.NIL
                    ) {
                      data.spcpSession = undefined
                    }
                    clearRespondentAccessErrors()
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
                handleError(error, form)
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

          return submitStorageModeFormMutation
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
                  if (
                    data &&
                    form.isSingleSubmission &&
                    form.authType !== FormAuthType.NIL
                  ) {
                    data.spcpSession = undefined
                  }
                  clearRespondentAccessErrors()
                  setSubmissionData({
                    id: submissionId,
                    timestamp,
                  })
                },
              },
            )
            .catch(async (error) => {
              // TODO(#5826): Remove when we have resolved the Network Error
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
                // defaults to the safest option of storage submission without virus scanning
                return submitStorageFormWithFetch()
              } else {
                handleError(error, form)
              }
            })
        }
        case FormResponseMode.Multirespondent:
          return (
            previousSubmissionId
              ? updateMultirespondentSubmissionMutation
              : submitMultirespondentFormMutation
          )
            .mutateAsync(formData, {
              onSuccess: ({ submissionId, timestamp }) => {
                trackSubmitForm(form)
                setSubmissionData({
                  id: submissionId,
                  timestamp,
                })
              },
            })
            .catch(async (error) => {
              showErrorToast(error, form)
            })
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
      previousSubmissionId,
      updateMultirespondentSubmissionMutation,
      submitMultirespondentFormMutation,
      submitEmailModeFormFetchMutation,
      submitEmailModeFormMutation,
      submitStorageModeFormMutation,
      submitStorageModeFormFetchMutation,
      navigate,
      formId,
      storePaymentMemory,
      clearRespondentAccessErrors,
    ],
  )

  useTimeout(generateVfnExpiryToast, expiryInMs)

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
        previousSubmissionId,
        error,
        submissionData,
        isAuthRequired,
        captchaContainerId: containerID,
        expiryInMs,
        isLoading: isLoading || (!!enableCaptcha && !hasLoaded),
        isPaymentEnabled,
        isPreview: false,
        setNumVisibleFields,
        hasSingleSubmissionValidationError,
        setHasSingleSubmissionValidationError,
        hasRespondentNotWhitelistedError,
        encryptedPreviousSubmission,
        previousSubmission,
        previousAttachments,
        setPreviousSubmission,
        ...commonFormValues,
        ...data,
        ...rest,
      }}
    >
      <Helmet
        title={
          formNotFoundMessage ? formNotFoundMessage.title : data?.form.title
        }
      />
      {formNotFoundMessage ? (
        <FormNotFound {...formNotFoundMessage} />
      ) : (
        children
      )}
    </PublicFormContext.Provider>
  )
}
