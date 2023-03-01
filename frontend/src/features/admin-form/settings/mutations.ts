import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import simplur from 'simplur'

import {
  AdminFormDto,
  FormAuthType,
  FormResponseMode,
  FormSettings,
  FormStatus,
} from '~shared/types/form/form'
import { TwilioCredentials } from '~shared/types/twilio'

import { ApiError } from '~typings/core'

import { GUIDE_PREVENT_EMAIL_BOUNCE } from '~constants/links'
import { useToast } from '~hooks/useToast'
import { formatOrdinal } from '~utils/stringFormat'

import { adminFormKeys } from '../common/queries'

import { adminFormSettingsKeys } from './queries'
import {
  deleteTwilioCredentials,
  updateFormAuthType,
  updateFormCaptcha,
  updateFormEmails,
  updateFormEsrvcId,
  updateFormInactiveMessage,
  updateFormLimit,
  updateFormStatus,
  updateFormTitle,
  updateFormWebhookRetries,
  updateFormWebhookUrl,
  updateTwilioCredentials,
} from './SettingsService'

export const useMutateFormSettings = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })
  const formSettingsQueryKey = adminFormSettingsKeys.id(formId)

  const updateFormData = useCallback(
    (newData: FormSettings) => {
      queryClient.setQueryData(adminFormSettingsKeys.id(formId), newData)
      // Only update adminForm if it already has prior data.
      queryClient.setQueryData<AdminFormDto | undefined>(
        adminFormKeys.id(formId),
        (oldData) =>
          oldData
            ? {
                ...oldData,
                ...newData,
              }
            : undefined,
      )
    },
    [formId, queryClient],
  )

  const handleSuccess = useCallback(
    ({
      newData,
      toastDescription,
    }: {
      newData: FormSettings
      toastDescription: string
    }) => {
      toast.closeAll()
      updateFormData(newData)
      toast({
        description: toastDescription,
      })
    },
    [toast, updateFormData],
  )

  const handleError = useCallback(
    (error: Error) => {
      toast.closeAll()
      toast({
        description: error.message,
        status: 'danger',
      })
    },
    [toast],
  )

  const mutateFormStatus = useMutation(
    (nextStatus: FormStatus) => updateFormStatus(formId, nextStatus),
    {
      onSuccess: (newData) => {
        // Show toast on success.
        const isNowPublic = newData.status === FormStatus.Public
        const toastStatusPublicMessage =
          newData.responseMode === FormResponseMode.Encrypt
            ? `Your form is now open.\n\nStore your secret key in a safe place. If you lose your secret key, all your responses will be lost permanently.`
            : `Your form is now open.\n\nIf you expect a large number of responses,  [AutoArchive your mailbox](${GUIDE_PREVENT_EMAIL_BOUNCE}) to avoid losing any of them.`
        const toastStatusClosedMessage = 'Your form is closed to new responses.'
        const toastStatusMessage = isNowPublic
          ? toastStatusPublicMessage
          : toastStatusClosedMessage

        handleSuccess({ newData, toastDescription: toastStatusMessage })
      },
      onError: handleError,
    },
  )

  const mutateFormLimit = useMutation(
    (nextLimit: number | null) => updateFormLimit(formId, nextLimit),
    {
      onSuccess: (newData) => {
        // Show toast on success.
        const toastStatusMessage = newData.submissionLimit
          ? simplur`Your form will now automatically close on the ${[
              newData.submissionLimit,
              formatOrdinal,
            ]} submission.`
          : 'The submission limit on your form is removed.'
        handleSuccess({ newData, toastDescription: toastStatusMessage })
      },
      onError: handleError,
    },
  )

  const mutateFormCaptcha = useMutation(
    (nextHasCaptcha: boolean) => updateFormCaptcha(formId, nextHasCaptcha),
    {
      onSuccess: (newData) => {
        handleSuccess({
          newData,
          toastDescription: `reCAPTCHA is now ${
            newData.hasCaptcha ? 'enabled' : 'disabled'
          } on your form.`,
        })
      },
      onError: handleError,
    },
  )

  const mutateFormTitle = useMutation(
    (nextTitle: string) => updateFormTitle(formId, nextTitle),
    {
      onSuccess: (newData) => {
        toast.closeAll()
        // Update new settings data in cache.
        updateFormData(newData)

        // Show toast on success.
        toast({
          description: "Your form's title has been updated.",
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
        handleSuccess({
          newData,
          toastDescription: "Your form's inactive message has been updated.",
        })
      },
      onError: handleError,
    },
  )

  const mutateFormEmails = useMutation(
    (nextEmails: string[]) => updateFormEmails(formId, nextEmails),
    {
      onSuccess: (newData) => {
        handleSuccess({
          newData,
          toastDescription: 'Emails successfully updated.',
        })
      },
      onError: handleError,
    },
  )

  const mutateFormEsrvcId = useMutation(
    (nextEsrvcId?: string) => updateFormEsrvcId(formId, nextEsrvcId),
    {
      onSuccess: (newData) => {
        handleSuccess({
          newData,
          toastDescription: 'E-service ID successfully updated.',
        })
      },
      onError: handleError,
    },
  )

  const mutateFormAuthType = useMutation<
    FormSettings,
    ApiError,
    FormAuthType,
    { previousSettings?: FormSettings }
  >((nextAuthType: FormAuthType) => updateFormAuthType(formId, nextAuthType), {
    // Optimistic update
    onMutate: async (newData) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(formSettingsQueryKey)

      // Snapshot the previous value
      const previousSettings =
        queryClient.getQueryData<FormSettings>(formSettingsQueryKey)

      // Optimistically update to the new value
      queryClient.setQueryData<FormSettings | undefined>(
        formSettingsQueryKey,
        (old) => {
          if (!old) return
          return {
            ...old,
            authType: newData,
          }
        },
      )

      // Return a context object with the snapshotted value
      return { previousSettings }
    },
    onSuccess: (newData) => {
      handleSuccess({
        newData,
        toastDescription: 'Form authentication successfully updated.',
      })
    },
    onError: (error, _newData, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(formSettingsQueryKey, context.previousSettings)
      }
      handleError(error)
    },
    onSettled: (_data, error) => {
      if (error) {
        // Refetch data if any error occurs
        queryClient.invalidateQueries(formSettingsQueryKey)
      }
    },
  })

  const mutateFormWebhookUrl = useMutation(
    (nextUrl?: string) => updateFormWebhookUrl(formId, nextUrl),
    {
      onSuccess: (newData, nextUrl) => {
        handleSuccess({
          newData,
          toastDescription: `Webhook URL successfully ${
            nextUrl ? 'updated' : 'removed'
          }.`,
        })
      },
      onError: handleError,
    },
  )

  const mutateWebhookRetries = useMutation(
    (nextEnabled: boolean) => updateFormWebhookRetries(formId, nextEnabled),
    {
      onSuccess: (newData, nextEnabled) => {
        handleSuccess({
          newData,
          toastDescription: `Webhook retries have been ${
            nextEnabled ? 'en' : 'dis'
          }abled.`,
        })
      },
      onError: handleError,
    },
  )

  return {
    mutateWebhookRetries,
    mutateFormWebhookUrl,
    mutateFormStatus,
    mutateFormLimit,
    mutateFormInactiveMessage,
    mutateFormCaptcha,
    mutateFormEmails,
    mutateFormTitle,
    mutateFormAuthType,
    mutateFormEsrvcId,
  }
}

export const useMutateTwilioCreds = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })

  const mutateFormTwilioDetails = useMutation(
    (credentials: TwilioCredentials) =>
      updateTwilioCredentials(formId, credentials),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(adminFormKeys.id(formId))
        toast.closeAll()
        // Show toast on success.
        toast({
          description: 'Updated Twilio credentials',
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

  const mutateFormTwilioDeletion = useMutation(
    () => deleteTwilioCredentials(formId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(adminFormKeys.id(formId))
        toast.closeAll()
        // Show toast on success.
        toast({
          description: 'Deleted Twilio credentials',
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
    mutateFormTwilioDeletion,
    mutateFormTwilioDetails,
  }
}
