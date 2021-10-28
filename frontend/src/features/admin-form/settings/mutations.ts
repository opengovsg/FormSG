import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import simplur from 'simplur'

import { FormId, FormStatus } from '~shared/types/form/form'

import { useToast } from '~hooks/useToast'
import { formatOrdinal } from '~utils/stringFormat'

import { adminFormSettingsKeys } from './queries'
import {
  updateFormCaptcha,
  updateFormEmails,
  updateFormInactiveMessage,
  updateFormLimit,
  updateFormStatus,
} from './SettingsService'

export const useMutateFormSettings = () => {
  const { formId } = useParams<{ formId: FormId }>()
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })

  const mutateFormStatus = useMutation(
    (nextStatus: FormStatus) => updateFormStatus(formId, nextStatus),
    {
      onSuccess: (newData) => {
        toast.closeAll()
        // Update new settings data in cache.
        queryClient.setQueryData(adminFormSettingsKeys.id(formId), newData)

        // Show toast on success.
        const isNowPublic = newData.status === FormStatus.Public
        const toastStatusMessage = isNowPublic
          ? `Congrats! Your form is now open for submission.\n\nFor high-traffic forms, [AutoArchive your mailbox](https://go.gov.sg/form-prevent-bounce) to prevent lost responses.`
          : 'Your form is closed for submission.'
        toast({
          description: toastStatusMessage,
        })
      },
      onError: (error: Error) => {
        toast.closeAll()
        toast({
          description: error.message,
          status: 'danger',
        })
      },
    },
  )

  const mutateFormLimit = useMutation(
    (nextLimit: number | null) => updateFormLimit(formId, nextLimit),
    {
      onSuccess: (newData) => {
        toast.closeAll()
        // Update new settings data in cache.
        queryClient.setQueryData(adminFormSettingsKeys.id(formId), newData)

        // Show toast on success.
        const toastStatusMessage = newData.submissionLimit
          ? simplur`Your form will now automatically close on the ${[
              newData.submissionLimit,
              formatOrdinal,
            ]} submission.`
          : 'The submission limit on your form is removed.'
        toast({
          description: toastStatusMessage,
        })
      },
      onError: (error: Error) => {
        toast.closeAll()
        toast({
          description: error.message,
          status: 'danger',
        })
      },
    },
  )

  const mutateFormCaptcha = useMutation(
    (nextHasCaptcha: boolean) => updateFormCaptcha(formId, nextHasCaptcha),
    {
      onSuccess: (newData) => {
        toast.closeAll()
        // Update new settings data in cache.
        queryClient.setQueryData(adminFormSettingsKeys.id(formId), newData)

        // Show toast on success.
        const toastStatusMessage = `reCAPTCHA is now ${
          newData.hasCaptcha ? 'enabled' : 'disabled'
        } on your form.`
        toast({
          description: toastStatusMessage,
        })
      },
      onError: (error: Error) => {
        toast.closeAll()
        toast({
          description: error.message,
          status: 'danger',
        })
      },
    },
  )

  const mutateFormInactiveMessage = useMutation(
    (nextMessage: string) => updateFormInactiveMessage(formId, nextMessage),
    {
      onSuccess: (newData) => {
        toast.closeAll()
        // Update new settings data in cache.
        queryClient.setQueryData(adminFormSettingsKeys.id(formId), newData)

        // Show toast on success.
        toast({
          description: "Your form's inactive message has been updated.",
        })
      },
      onError: (error: Error) => {
        toast.closeAll()
        toast({
          description: error.message,
          status: 'danger',
        })
      },
    },
  )

  const mutateFormEmails = useMutation(
    (nextEmails: string[]) => updateFormEmails(formId, nextEmails),
    {
      onSuccess: (newData) => {
        toast.closeAll()
        // Update new settings data in cache.
        queryClient.setQueryData(adminFormSettingsKeys.id(formId), newData)

        // Show toast on success.
        toast({
          description: 'Emails successfully updated.',
        })
      },
      onError: (error: Error) => {
        toast.closeAll()
        toast({
          description: error.message,
          status: 'danger',
        })
      },
    },
  )

  return {
    mutateFormStatus,
    mutateFormLimit,
    mutateFormInactiveMessage,
    mutateFormCaptcha,
    mutateFormEmails,
  }
}
