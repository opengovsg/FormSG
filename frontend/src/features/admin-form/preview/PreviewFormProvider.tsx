import { useCallback, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { SubmitHandler } from 'react-hook-form'
import { datadogLogs } from '@datadog/browser-logs'
import get from 'lodash/get'
import simplur from 'simplur'

import { FormAuthType, FormResponseMode } from '~shared/types/form'

import { usePreviewForm } from '~/features/admin-form/common/queries'
import { FormNotFound } from '~/features/public-form/components/FormNotFound'
import {
  PublicFormContext,
  SubmissionData,
} from '~/features/public-form/PublicFormContext'
import { useCommonFormProvider } from '~/features/public-form/PublicFormProvider'

import { useTimeout } from '~hooks/useTimeout'
import { HttpError } from '~services/ApiService'
import { FormFieldValues } from '~templates/Field'

import NotFoundErrorPage from '~pages/NotFoundError'

import { useEnv } from '../../env/queries'
import { axiosDebugFlow } from '../../public-form/utils'
import { usePreviewFormMutations } from '../common/mutations'

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

  const { data, isLoading, error, ...rest } = usePreviewForm(
    formId,
    // Stop querying once submissionData is present.
    /* enabled= */ !submissionData,
  )

  const { data: { useFetchForSubmissions } = {} } = useEnv()

  const { isNotFormId, toast, vfnToastIdRef, expiryInMs, ...commonFormValues } =
    useCommonFormProvider(formId)

  const showErrorToast = useCallback(
    (error) => {
      toast({
        status: 'danger',
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred whilst processing your submission. Please refresh and try again.',
      })
    },
    [toast],
  )

  useEffect(() => {
    return () => {
      document.title = 'FormSG'
    }
  }, [])

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

  useTimeout(generateVfnExpiryToast, expiryInMs)

  const isAuthRequired = useMemo(
    () =>
      !!data?.form &&
      data.form.authType !== FormAuthType.NIL &&
      !data.spcpSession,
    [data?.form, data?.spcpSession],
  )

  const {
    submitEmailModeFormMutation,
    submitStorageModeFormMutation,
    // TODO (#5826): Fallback mutation using Fetch. Remove once network error is resolved
    submitEmailModeFormFetchMutation,
    submitStorageModeFormFetchMutation,
  } = usePreviewFormMutations(formId)

  const handleSubmitForm: SubmitHandler<FormFieldValues> = useCallback(
    async (formInputs) => {
      const { form } = data ?? {}
      if (!form) return

      const formData = {
        formFields: form.form_fields,
        formLogics: form.form_logics,
        formInputs,
      }

      const logMeta = {
        action: 'handleSubmitForm',
        isPreview: true,
        useFetchForSubmissions,
      }

      const onSuccess = ({ submissionId }: { submissionId: string }) =>
        setSubmissionData({
          id: submissionId,
          timestamp: Date.now(),
        })

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
                showErrorToast(error)
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
                .mutateAsync(formData, { onSuccess })
                // Using catch since we are using mutateAsync and react-hook-form will continue bubbling this up.
                .catch((error) => {
                  // TODO (#5826): Fallback mutation using Fetch. Remove once network error is resolved
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
                    // Show error toast from axios mutation if not network error
                    showErrorToast(error)
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
                    responseMode: 'storage',
                    method: 'fetch',
                    error: {
                      message: error.message,
                      name: error.name,
                      stack: error.stack,
                    },
                  },
                })
                showErrorToast(error)
              })
          }

          // TODO (#5826): Toggle to use fetch for submissions instead of axios. If enabled, this is used for testing and to use fetch instead of axios by default if testing shows fetch is more  stable. Remove once network error is resolved
          if (useFetchForSubmissions) {
            return submitStorageFormWithFetch()
          } else {
            datadogLogs.logger.info(`handleSubmitForm: submitting via axios`, {
              meta: {
                ...logMeta,
                responseMode: 'storage',
                method: 'axios',
              },
            })

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
                .catch((error) => {
                  // TODO (#5826): Fallback mutation using Fetch. Remove once network error is resolved
                  datadogLogs.logger.warn(
                    `handleSubmitForm: ${error.message}`,
                    {
                      meta: {
                        ...logMeta,
                        responseMode: 'storage',
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
                    return submitStorageFormWithFetch()
                  } else {
                    // Show error toast from axios mutation if not network error
                    showErrorToast(error)
                  }
                })
            )
          }
        }
      }
    },
    [
      data,
      showErrorToast,
      submitEmailModeFormMutation,
      submitStorageModeFormMutation,
      submitEmailModeFormFetchMutation,
      submitStorageModeFormFetchMutation,
      useFetchForSubmissions,
    ],
  )

  if (isNotFormId) {
    return <NotFoundErrorPage />
  }

  return (
    <PublicFormContext.Provider
      value={{
        handleSubmitForm,
        formId,
        error,
        submissionData,
        isAuthRequired,
        expiryInMs,
        isLoading,
        handleLogout: undefined,
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
