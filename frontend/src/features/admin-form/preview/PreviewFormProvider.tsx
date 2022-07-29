import { useCallback, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { SubmitHandler } from 'react-hook-form'
import { Link, Text } from '@chakra-ui/react'
import { isEqual } from 'lodash'
import get from 'lodash/get'
import simplur from 'simplur'

import { BasicField } from '~shared/types'
import {
  FormAuthType,
  FormResponseMode,
  PreviewFormViewDto,
} from '~shared/types/form'

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
import { FormFieldValues } from '~templates/Field'

import NotFoundErrorPage from '~pages/NotFoundError'

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

  const [cachedDto, setCachedDto] = useState<PreviewFormViewDto>()

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

  const { submitEmailModeFormMutation, submitStorageModeFormMutation } =
    usePreviewFormMutations(formId)

  const handleSubmitForm: SubmitHandler<FormFieldValues> = useCallback(
    async (formInputs) => {
      const { form } = cachedDto ?? {}
      if (!form) return

      switch (form.responseMode) {
        case FormResponseMode.Email:
          // Using mutateAsync so react-hook-form goes into loading state.
          return (
            submitEmailModeFormMutation
              .mutateAsync(
                { formFields: form.form_fields, formInputs },
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
      showErrorToast,
      submitEmailModeFormMutation,
      submitStorageModeFormMutation,
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
        sectionScrollData,
        isAuthRequired,
        expiryInMs,
        isLoading,
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
