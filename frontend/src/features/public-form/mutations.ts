import { useMutation } from 'react-query'

import { FormAuthType, SubmitFormFeedbackBodyDto } from '~shared/types/form'

import { useToast } from '~hooks/useToast'

import { useStorePrefillQuery } from './hooks/useStorePrefillQuery'
import {
  getPublicFormAuthRedirectUrl,
  logoutPublicForm,
  SubmitEmailFormArgs,
  submitEmailModeForm,
  submitEmailModeFormWithFetch,
  submitFormFeedback,
  SubmitStorageFormArgs,
  submitStorageModeForm,
  submitStorageModeFormWithFetch,
} from './PublicFormService'

export const usePublicAuthMutations = (formId: string) => {
  const { storePrefillQuery } = useStorePrefillQuery()

  const toast = useToast({ status: 'success', isClosable: true })

  const handleLoginMutation = useMutation(
    () => {
      const encodedQuery = storePrefillQuery()
      return getPublicFormAuthRedirectUrl(formId, false, encodedQuery)
    },
    {
      onSuccess: (redirectUrl) => {
        window.location.assign(redirectUrl)
      },
      onError: (error: Error) => {
        toast({
          description: error.message,
          status: 'danger',
        })
      },
    },
  )

  const handleLogoutMutation = useMutation(
    (authType: Exclude<FormAuthType, FormAuthType.NIL>) =>
      logoutPublicForm(authType),
    {
      onSuccess: () => {
        // Refresh browser to reset form state.
        window.location.reload()
      },
    },
  )

  return {
    handleLoginMutation,
    handleLogoutMutation,
  }
}

export const usePublicFormMutations = (
  formId: string,
  submissionId: string,
) => {
  const toast = useToast({ isClosable: true })

  const submitEmailModeFormMutation = useMutation(
    (args: Omit<SubmitEmailFormArgs, 'formId'>) => {
      return submitEmailModeForm({ ...args, formId })
    },
  )

  const submitStorageModeFormMutation = useMutation(
    (args: Omit<SubmitStorageFormArgs, 'formId'>) => {
      return submitStorageModeForm({ ...args, formId })
    },
  )

  // TODO (#5826): Fallback mutation using Fetch. Remove once network error is resolved
  const submitEmailModeFormFetchMutation = useMutation(
    (args: Omit<SubmitEmailFormArgs, 'formId'>) => {
      return submitEmailModeFormWithFetch({ ...args, formId })
    },
  )

  const submitStorageModeFormFetchMutation = useMutation(
    (args: Omit<SubmitStorageFormArgs, 'formId'>) => {
      return submitStorageModeFormWithFetch({ ...args, formId })
    },
  )

  const submitFormFeedbackMutation = useMutation(
    (args: SubmitFormFeedbackBodyDto) =>
      submitFormFeedback(formId, submissionId, args),
    {
      onError: (error: Error) => {
        toast({ status: 'danger', description: error.message })
      },
    },
  )

  return {
    submitEmailModeFormMutation,
    submitStorageModeFormMutation,
    submitFormFeedbackMutation,
    submitStorageModeFormFetchMutation,
    submitEmailModeFormFetchMutation,
  }
}
