import { useCallback, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import get from 'lodash/get'
import simplur from 'simplur'

import { FormAuthType, FormResponseMode } from '~shared/types/form'

import { useFormTemplate } from '~/features/admin-form/common/queries'
import { FormNotFound } from '~/features/public-form/components/FormNotFound'
import { PublicFormContext } from '~/features/public-form/PublicFormContext'
import {
  augmentFormFields,
  getFieldPrefillMap,
  useCommonFormProvider,
} from '~/features/public-form/PublicFormProvider'

import { useTimeout } from '~hooks/useTimeout'
import { HttpError } from '~services/ApiService'
import { FormFieldValues } from '~templates/Field'

import NotFoundErrorPage from '~pages/NotFoundError'

interface PreviewFormProviderProps {
  formId: string
  children: React.ReactNode
}

export const TemplateFormProvider = ({
  formId,
  children,
}: PreviewFormProviderProps): JSX.Element => {
  const { t } = useTranslation()
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

  const onSaveDraft = () => {
    toast({
      description: t(
        'features.publicForm.components.saveDraft.toast.previewNoDraftSaved',
      ),
    })
  }

  const [searchParams] = useSearchParams()

  const form = data?.form
  const formFields = useMemo(() => {
    if (!form) return []
    return form.form_fields
  }, [form])
  const currentWorkflowStepNumber = 0
  const formWorkflow =
    form?.responseMode === FormResponseMode.Multirespondent
      ? form.workflow
      : undefined
  const currentStepNumberWorkflowStep =
    formWorkflow && formWorkflow.length > currentWorkflowStepNumber
      ? formWorkflow[currentWorkflowStepNumber]
      : undefined

  const fieldPrefillMap = useMemo(
    () => (formFields ? getFieldPrefillMap(formFields, searchParams) : {}),
    [formFields, searchParams],
  )
  const augmentedFormFields = useMemo(
    () =>
      formFields
        ? augmentFormFields(formFields, currentStepNumberWorkflowStep)
        : [],
    [formFields, currentStepNumberWorkflowStep],
  )

  const defaultFormValues = useMemo(() => ({}), [])

  const formMethods = useForm<FormFieldValues>({
    defaultValues: defaultFormValues,
  })

  const isSaveDraftEnabled = Boolean(form?.isSaveDraftEnabled)

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
        isPreview: true,
        isPaymentEnabled: false,
        onSaveDraft,
        isSaveDraftEnabled,
        defaultFormValues,
        augmentedFormFields,
        fieldPrefillMap,
        hasSingleSubmissionValidationError: false,
        hasRespondentNotWhitelistedError: false,
        ...commonFormValues,
        ...data,
        ...rest,
      }}
    >
      <Helmet
        title={
          isFormNotFound
            ? t('features.publicForm.errors.notFound')
            : data?.form.title
        }
      />
      {isFormNotFound ? (
        <FormNotFound message={error?.message} />
      ) : (
        <FormProvider {...formMethods}>{children}</FormProvider>
      )}
    </PublicFormContext.Provider>
  )
}
