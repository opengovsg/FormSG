import { useCallback, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import get from 'lodash/get'
import simplur from 'simplur'

import { FormAuthType } from '~shared/types/form'

import { useFormTemplate } from '~/features/admin-form/common/queries'
import { FormNotFound } from '~/features/public-form/components/FormNotFound'
import { PublicFormContext } from '~/features/public-form/PublicFormContext'
import { useCommonFormProvider } from '~/features/public-form/PublicFormProvider'

import { useTimeout } from '~hooks/useTimeout'
import { HttpError } from '~services/ApiService'

import NotFoundErrorPage from '~pages/NotFoundError'

interface PreviewFormProviderProps {
  formId: string
  children: React.ReactNode
}

export const TemplateFormProvider = ({
  formId,
  children,
}: PreviewFormProviderProps): JSX.Element => {
  const { data, isLoading, error, ...rest } = useFormTemplate(formId)

  const { isNotFormId, toast, vfnToastIdRef, expiryInMs, ...commonFormValues } =
    useCommonFormProvider(formId)

  useEffect(() => {
    return () => {
      document.title = 'FormSG'
    }
  }, [])

  const isFormNotFound = useMemo(() => {
    return (
      error instanceof HttpError &&
      (error.code === 404 || error.code === 410 || error.code === 403)
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

  if (isNotFormId) {
    return <NotFoundErrorPage />
  }

  return (
    <PublicFormContext.Provider
      value={{
        handleSubmitForm: undefined,
        formId,
        error,
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
