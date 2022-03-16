import { useMutation, useQueryClient } from 'react-query'

import { FormAuthType } from '~shared/types/form'

import { useToast } from '~hooks/useToast'

import {
  getPublicFormAuthRedirectUrl,
  logoutPublicForm,
  submitEmailModeForm,
  SubmitEmailModeFormArgs,
} from './PublicFormService'
import { publicFormKeys } from './queries'

export const usePublicAuthMutations = (formId: string) => {
  const queryClient = useQueryClient()

  const toast = useToast({ status: 'success', isClosable: true })

  const handleLoginMutation = useMutation(
    () => getPublicFormAuthRedirectUrl(formId),
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
        queryClient.invalidateQueries(publicFormKeys.base)
        toast({
          description: 'Logged out successfully',
        })
      },
    },
  )

  return {
    handleLoginMutation,
    handleLogoutMutation,
  }
}

export const usePublicFormMutations = (formId: string) => {
  const submitEmailModeFormMutation = useMutation(
    (args: Omit<SubmitEmailModeFormArgs, 'formId'>) => {
      return submitEmailModeForm({ ...args, formId })
    },
  )

  return { submitEmailModeFormMutation }
}
