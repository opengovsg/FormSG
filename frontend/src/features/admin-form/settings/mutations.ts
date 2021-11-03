import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import simplur from 'simplur'

import {
  AdminFormDto,
  FormAuthType,
  FormSettings,
  FormStatus,
} from '~shared/types/form/form'

import { ApiError } from '~typings/core'

import { useToast } from '~hooks/useToast'
import { formatOrdinal } from '~utils/stringFormat'

import { adminFormKeys } from '../common/queries'

import { adminFormSettingsKeys } from './queries'
import {
  updateFormAuthType,
  updateFormCaptcha,
  updateFormEmails,
  updateFormInactiveMessage,
  updateFormLimit,
  updateFormStatus,
  updateFormTitle,
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

  const mutateFormStatus = useMutation(
    (nextStatus: FormStatus) => updateFormStatus(formId, nextStatus),
    {
      onSuccess: (newData) => {
        toast.closeAll()
        updateFormData(newData)

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
        updateFormData(newData)

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
        updateFormData(newData)

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
        toast.closeAll()
        // Update new settings data in cache.
        updateFormData(newData)

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
        updateFormData(newData)

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
      toast.closeAll()
      // Update new settings data in cache.
      updateFormData(newData)
      // Show toast on success.
      toast({
        description: 'Form authentication successfully toggled.',
      })
    },
    onError: (error, _newData, context) => {
      toast.closeAll()
      if (context?.previousSettings) {
        queryClient.setQueryData(formSettingsQueryKey, context.previousSettings)
      }
      toast({
        description: error.message,
        status: 'danger',
      })
    },
    onSettled: (_data, error) => {
      if (error) {
        // Refetch data if any error occurs
        queryClient.invalidateQueries(formSettingsQueryKey)
      }
    },
  })

  return {
    mutateFormStatus,
    mutateFormLimit,
    mutateFormInactiveMessage,
    mutateFormCaptcha,
    mutateFormEmails,
    mutateFormTitle,
    mutateFormAuthType,
  }
}
