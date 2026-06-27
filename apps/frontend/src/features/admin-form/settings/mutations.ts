import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import {
  FormAuthType,
  FormResponseMode,
  FormSettings,
  FormStatus,
  FormSupportedLanguages,
  StorageFormSettings,
  WebhookFormat,
} from 'formsg-shared/types/form/form'
import { PAYMENT_DELETE_DEFAULT } from 'formsg-shared/utils/payments'

import { ApiError } from '~typings/core'

import { useToast } from '~hooks/useToast'
import { convertUnicodeLocaleToLanguage } from '~utils/multiLanguage'
import { formatOrdinal } from '~utils/stringFormat'

import { updateFormPayments } from '../common/AdminFormPageService'
import { adminFormKeys } from '../common/queries'

import { adminFormSettingsKeys } from './queries'
import {
  createStripeAccount,
  MrfEmailNotificationSettings,
  unlinkStripeAccount,
  updateBusinessInfo,
  updateFormAuthType,
  updateFormCaptcha,
  updateFormEmails,
  updateFormEsrvcId,
  updateFormHasMultiLang,
  updateFormInactiveMessage,
  updateFormIsSaveDraftEnabled,
  updateFormIssueNotification,
  updateFormLimit,
  updateFormRespondentCopy,
  updateFormStatus,
  updateFormSupportedLanguages,
  updateFormTitle,
  updateFormWebhookFormat,
  updateFormWebhookRetries,
  updateFormWebhookUrl,
  updateFormWhitelistSetting,
  updateGstEnabledFlag,
  updateIsSingleSubmission,
  updateIsSubmitterIdCollectionEnabled,
  updateMrfEmailNotifications,
  updateMrfStatusTracker,
} from './SettingsService'

export const useMutateFormSettings = () => {
  const { t } = useTranslation()
  const { formId } = useParams()
  if (!formId) {
    throw new Error(t('features.adminForm.settings.mutations.missingFormId'))
  }

  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })
  const formSettingsQueryKey = adminFormSettingsKeys.id(formId)

  const updateFormData = useCallback(
    (newData: FormSettings) => {
      queryClient.setQueryData(adminFormSettingsKeys.id(formId), newData)
      // Only update adminForm if it already has prior data.
      queryClient.setQueryData<FormSettings | undefined>(
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

  const generateErrorToast = useCallback(
    (message: string) => {
      toast.closeAll()
      toast({
        description: message,
        status: 'danger',
      })
    },
    [toast],
  )

  const generateSuccessToast = useCallback(
    (message: string) => {
      toast.closeAll()
      toast({
        description: message,
      })
    },
    [toast],
  )

  const handleSuccess = useCallback(
    ({
      newData,
      toastDescription,
    }: {
      newData: FormSettings
      toastDescription: string
    }) => {
      updateFormData(newData)
      generateSuccessToast(toastDescription)
    },
    [updateFormData, generateSuccessToast],
  )

  const handleError = useCallback(
    (error: Error) => {
      generateErrorToast(error.message)
    },
    [generateErrorToast],
  )

  const mutateFormStatus = useMutation(
    (nextStatus: FormStatus) => updateFormStatus(formId, nextStatus),
    {
      onSuccess: (newData) => {
        // Show toast on success.
        const isNowPublic = newData.status === FormStatus.Public
        const toastStatusPublicMessage =
          newData.responseMode === FormResponseMode.Encrypt
            ? t(
                'features.adminForm.settings.mutations.formStatus.openStorageMode',
              )
            : t('features.adminForm.settings.mutations.formStatus.open')
        const toastStatusClosedMessage = t(
          'features.adminForm.settings.mutations.formStatus.closed',
        )
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
        const successToastI18nKey =
          newData.responseMode === FormResponseMode.Multirespondent
            ? 'features.adminForm.settings.general.limit.toast.successMrf'
            : 'features.adminForm.settings.general.limit.toast.successStorageMode'
        const toastStatusMessage = newData.submissionLimit
          ? t(successToastI18nKey, {
              submissionLimit: formatOrdinal(newData.submissionLimit),
            })
          : t('features.adminForm.settings.general.limit.toast.successRemoved')
        handleSuccess({ newData, toastDescription: toastStatusMessage })
      },
      onError: handleError,
    },
  )

  const mutateFormHasMultiLang = useMutation(
    (nextHasMultiLang: boolean) =>
      updateFormHasMultiLang(formId, nextHasMultiLang),
    {
      onSuccess: (newData) => {
        handleSuccess({
          newData,
          toastDescription: newData.hasMultiLang
            ? t('features.adminForm.settings.mutations.multiLang.enabled')
            : t('features.adminForm.settings.mutations.multiLang.disabled'),
        })
      },
      onError: handleError,
    },
  )

  const mutateFormSupportedLanguages = useMutation(
    (nextSupportedLanguages?: FormSupportedLanguages) =>
      updateFormSupportedLanguages(
        formId,
        nextSupportedLanguages?.nextSupportedLanguages,
      ),
    {
      onSuccess: (newData, newSupportedLanguages) => {
        if (newSupportedLanguages && newSupportedLanguages.selectedLanguage) {
          const supportedLanguages =
            newSupportedLanguages.nextSupportedLanguages ?? []
          const languageToDisplay = convertUnicodeLocaleToLanguage(
            newSupportedLanguages.selectedLanguage,
          )

          const isSelectedLanguageSupported = supportedLanguages.includes(
            newSupportedLanguages.selectedLanguage,
          )
            ? t(
                'features.adminForm.settings.mutations.supportedLanguages.selectable',
                { language: languageToDisplay },
              )
            : t(
                'features.adminForm.settings.mutations.supportedLanguages.hidden',
                { language: languageToDisplay },
              )

          handleSuccess({
            newData,
            toastDescription: isSelectedLanguageSupported,
          })
        }
      },
      onError: handleError,
    },
  )

  const mutateFormIsSaveDraftEnabled = useMutation(
    (nextIsSaveDraftEnabled: boolean) =>
      updateFormIsSaveDraftEnabled(formId, nextIsSaveDraftEnabled),
    {
      onSuccess: (newData) => {
        handleSuccess({
          newData,
          toastDescription: newData.isSaveDraftEnabled
            ? t('features.adminForm.settings.mutations.saveDraft.enabled')
            : t('features.adminForm.settings.mutations.saveDraft.disabled'),
        })
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
          toastDescription: newData.hasCaptcha
            ? t('features.adminForm.settings.mutations.captcha.enabled')
            : t('features.adminForm.settings.mutations.captcha.disabled'),
        })
      },
      onError: handleError,
    },
  )

  const mutateFormIssueNotification = useMutation(
    (nextHasIssueNotification: boolean) =>
      updateFormIssueNotification(formId, nextHasIssueNotification),
    {
      onSuccess: (newData) => {
        handleSuccess({
          newData,
          toastDescription: newData.hasIssueNotification
            ? t(
                'features.adminForm.settings.mutations.issueNotification.enabled',
              )
            : t(
                'features.adminForm.settings.mutations.issueNotification.disabled',
              ),
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
          description: t(
            'features.adminForm.settings.mutations.formTitleUpdated',
          ),
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
          toastDescription: t(
            'features.adminForm.settings.mutations.inactiveMessageUpdated',
          ),
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
          toastDescription: t(
            'features.adminForm.settings.mutations.emailsUpdated',
          ),
        })
      },
      onError: handleError,
    },
  )

  const mutateMrfEmailNotifications = useMutation(
    (MrfEmailNotificationSettings: MrfEmailNotificationSettings) =>
      updateMrfEmailNotifications(formId, MrfEmailNotificationSettings),
    {
      onSuccess: (newData) => {
        handleSuccess({
          newData,
          toastDescription: t(
            'features.adminForm.settings.mutations.emailsUpdated',
          ),
        })
      },
      onError: handleError,
    },
  )

  const mutateMrfStatusTracker = useMutation(
    (nextHasStatusTracker: boolean) =>
      updateMrfStatusTracker(formId, {
        hasStatusTracker: nextHasStatusTracker,
      }),
    {
      onSuccess: (newData) => {
        const hasStatusTracker =
          'hasStatusTracker' in newData ? newData.hasStatusTracker : false

        handleSuccess({
          newData,
          toastDescription: `${t('features.adminForm.toasts.statusTracker.successBefore')} ${hasStatusTracker ? '' : t('features.adminForm.toasts.statusTracker.disabled')}${t('features.adminForm.toasts.statusTracker.successAfter')}`,
        })
      },
      onError: handleError,
    },
  )

  const mutateFormRespondentCopy = useMutation(
    (nextHasRespondentCopy: boolean) =>
      updateFormRespondentCopy(formId, nextHasRespondentCopy),
    {
      onSuccess: (newData) => {
        handleSuccess({
          newData,
          toastDescription: `${t('features.adminForm.toasts.respondentCopy.successBefore')} ${newData.hasRespondentCopy ? '' : t('features.adminForm.toasts.respondentCopy.disabled')}${t('features.adminForm.toasts.respondentCopy.successAfter')}`,
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
          toastDescription: t(
            'features.adminForm.settings.mutations.esrvcIdUpdated',
          ),
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
  >(
    (nextAuthType: FormAuthType) => {
      return updateFormAuthType(formId, nextAuthType)
    },
    {
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
      onSuccess: (newData, newAuthType, context) => {
        const prevAuthType = context?.previousSettings?.authType
        const toastDescription =
          prevAuthType === FormAuthType.NIL
            ? t('features.adminForm.settings.mutations.authType.enabled')
            : newAuthType === FormAuthType.NIL
              ? t('features.adminForm.settings.mutations.authType.disabled')
              : t('features.adminForm.settings.mutations.authType.updated')
        handleSuccess({
          newData,
          toastDescription,
        })
      },
      onError: (error, _newData, context) => {
        if (context?.previousSettings) {
          queryClient.setQueryData(
            formSettingsQueryKey,
            context.previousSettings,
          )
        }
        handleError(error)
      },
      onSettled: (_data, error) => {
        if (error) {
          // Refetch data if any error occurs
          queryClient.invalidateQueries(formSettingsQueryKey)
        }
      },
    },
  )

  const mutateIsSubmitterIdCollectionEnabled = useMutation(
    (nextIsSubmitterIdCollectionEnabled: boolean) =>
      updateIsSubmitterIdCollectionEnabled(
        formId,
        nextIsSubmitterIdCollectionEnabled,
      ),
    {
      onSuccess: (newData) => {
        handleSuccess({
          newData,
          toastDescription: newData.isSubmitterIdCollectionEnabled
            ? t('features.adminForm.settings.mutations.submitterId.enabled')
            : t('features.adminForm.settings.mutations.submitterId.disabled'),
        })
      },
      onError: handleError,
    },
  )

  const mutateIsSingleSubmission = useMutation(
    (nextIsSingleSubmissionPerNricEnabled: boolean) => {
      return updateIsSingleSubmission(
        formId,
        nextIsSingleSubmissionPerNricEnabled,
      )
    },
    {
      onSuccess: (newData) => {
        handleSuccess({
          newData,
          toastDescription: newData.isSingleSubmission
            ? t(
                'features.adminForm.settings.mutations.singleSubmission.enabled',
              )
            : t(
                'features.adminForm.settings.mutations.singleSubmission.disabled',
              ),
        })
      },
      onError: handleError,
    },
  )

  const mutateFormWhitelistSetting = useMutation(
    (whitelistCsvString: Promise<string> | null) => {
      return updateFormWhitelistSetting(formId, whitelistCsvString)
    },
    {
      onSuccess: (_newData, variable) => {
        generateSuccessToast(
          variable
            ? t('features.adminForm.settings.mutations.whitelist.uploaded')
            : t('features.adminForm.settings.mutations.whitelist.removed'),
        )
      },
      onError: (error: Error) => {
        generateErrorToast(error.message)
      },
    },
  )

  const mutateFormWebhookUrl = useMutation(
    (nextUrl?: string) => updateFormWebhookUrl(formId, nextUrl),
    {
      onSuccess: (newData, nextUrl) => {
        handleSuccess({
          newData,
          toastDescription: nextUrl
            ? t('features.adminForm.settings.mutations.webhookUrl.updated')
            : t('features.adminForm.settings.mutations.webhookUrl.removed'),
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
          toastDescription: nextEnabled
            ? t('features.adminForm.settings.mutations.webhookRetries.enabled')
            : t(
                'features.adminForm.settings.mutations.webhookRetries.disabled',
              ),
        })
      },
      onError: handleError,
    },
  )

  const mutateWebhookFormat = useMutation(
    (nextFormat: WebhookFormat) => updateFormWebhookFormat(formId, nextFormat),
    {
      onSuccess: (newData, nextFormat) => {
        handleSuccess({
          newData,
          toastDescription:
            nextFormat === WebhookFormat.V1
              ? t('features.adminForm.settings.mutations.webhookFormat.v1')
              : t('features.adminForm.settings.mutations.webhookFormat.v4'),
        })
      },
      onError: handleError,
    },
  )

  const mutateFormBusiness = useMutation(
    (businessInfo: StorageFormSettings['business']) =>
      updateBusinessInfo(formId, businessInfo),
    {
      onSuccess: (newData) => {
        handleSuccess({
          newData,
          toastDescription: t(
            'features.adminForm.settings.mutations.businessInfoUpdated',
          ),
        })
      },
      onError: handleError,
    },
  )

  const mutateGST = useMutation(
    (gstEnabledFlag: StorageFormSettings['payments_field']['gst_enabled']) =>
      updateGstEnabledFlag(formId, gstEnabledFlag),
    {
      onSuccess: (newData) => {
        handleSuccess({
          newData,
          toastDescription: t(
            'features.adminForm.settings.mutations.gstUpdated',
          ),
        })
      },
      onError: handleError,
    },
  )

  return {
    mutateWebhookRetries,
    mutateWebhookFormat,
    mutateFormWebhookUrl,
    mutateFormStatus,
    mutateFormLimit,
    mutateFormHasMultiLang,
    mutateFormSupportedLanguages,
    mutateFormInactiveMessage,
    mutateFormIsSaveDraftEnabled,
    mutateFormCaptcha,
    mutateFormIssueNotification,
    mutateFormEmails,
    mutateMrfEmailNotifications,
    mutateMrfStatusTracker,
    mutateFormRespondentCopy,
    mutateFormTitle,
    mutateFormAuthType,
    mutateIsSubmitterIdCollectionEnabled,
    mutateIsSingleSubmission,
    mutateFormWhitelistSetting,
    mutateFormEsrvcId,
    mutateFormBusiness,
    mutateGST,
  }
}

export const useMutateStripeAccount = () => {
  const { t } = useTranslation()
  const { formId } = useParams()
  if (!formId) {
    throw new Error(t('features.adminForm.settings.mutations.missingFormId'))
  }
  const queryClient = useQueryClient()

  const linkStripeAccountMutation = useMutation(
    () => createStripeAccount(formId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(adminFormKeys.id(formId))
        queryClient.invalidateQueries(adminFormSettingsKeys.id(formId))
      },
    },
  )

  const unlinkStripeAccountMutation = useMutation(
    () => {
      updateFormPayments(formId, PAYMENT_DELETE_DEFAULT)
      return unlinkStripeAccount(formId)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(adminFormKeys.id(formId))
        queryClient.invalidateQueries(adminFormSettingsKeys.id(formId))
      },
    },
  )

  return {
    linkStripeAccountMutation,
    unlinkStripeAccountMutation,
  }
}
