import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { AnalyticsEventType, FormSavedViewInput } from 'formsg-shared/types'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'
import {
  createFormSavedView,
  deleteFormSavedView,
  updateFormSavedView,
} from '~features/admin-form/responses/AdminSubmissionsService'
import { logAnalyticsEvent } from '~features/analytics/AnalyticsEventService'

export const useSavedViewMutation = () => {
  const { formId } = useParams()
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'danger' })

  return useMutation(
    (savedView: FormSavedViewInput) =>
      createFormSavedView(formId as string, savedView),
    {
      onSuccess: (savedViews) => {
        const created = savedViews[savedViews.length - 1]
        if (created) {
          logAnalyticsEvent(formId, {
            type: AnalyticsEventType.ResultsSavedViewCreated,
            content: { savedViewId: created._id },
          })
        }
        return queryClient.invalidateQueries(adminFormKeys.id(formId as string))
      },
      onError: (error) => {
        toast({ description: String(error) })
      },
    },
  )
}

export const useUpdateSavedViewMutation = () => {
  const { t } = useTranslation()
  const { formId } = useParams()
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })

  return useMutation(
    ({
      savedViewId,
      savedView,
    }: {
      savedViewId: string
      savedView: FormSavedViewInput
    }) => updateFormSavedView(formId as string, savedViewId, savedView),
    {
      onSuccess: async (_, { savedViewId }) => {
        logAnalyticsEvent(formId, {
          type: AnalyticsEventType.ResultsSavedViewUpdated,
          content: { savedViewId },
        })
        await queryClient.invalidateQueries(adminFormKeys.id(formId as string))
        toast.closeAll()
        toast({
          description: t(
            'features.adminForm.responses.responsesPage.storage.unlockedResponses.views.saveViewSuccess',
          ),
        })
      },
      onError: (error: Error) => {
        toast.closeAll()
        toast({ description: error.message, status: 'danger' })
      },
    },
  )
}

export const useDeleteSavedViewMutation = () => {
  const { t } = useTranslation()
  const { formId } = useParams()
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })

  return useMutation(
    (savedViewId: string) => deleteFormSavedView(formId as string, savedViewId),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(adminFormKeys.id(formId as string))
        toast.closeAll()
        toast({
          description: t(
            'features.adminForm.responses.responsesPage.storage.unlockedResponses.views.deleteViewSuccess',
          ),
        })
      },
      onError: (error: Error) => {
        toast.closeAll()
        toast({ description: error.message, status: 'danger' })
      },
    },
  )
}
