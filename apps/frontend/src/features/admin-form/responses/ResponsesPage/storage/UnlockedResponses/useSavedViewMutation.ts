import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { FormSavedViewInput } from 'formsg-shared/types'

import { responsesPageNs } from '~/i18n/locales/features/admin-form/responses/responses-page'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'
import {
  createFormSavedView,
  deleteFormSavedView,
} from '~features/admin-form/responses/AdminSubmissionsService'

export const useSavedViewMutation = () => {
  const { formId } = useParams()
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'danger' })

  return useMutation(
    (savedView: FormSavedViewInput) =>
      createFormSavedView(formId as string, savedView),
    {
      onSuccess: () =>
        queryClient.invalidateQueries(adminFormKeys.id(formId as string)),
      onError: (error) => {
        toast({ description: String(error) })
      },
    },
  )
}

export const useDeleteSavedViewMutation = () => {
  const { t } = useTranslation(responsesPageNs)
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
          description: t('storage.unlockedResponses.views.deleteViewSuccess'),
        })
      },
      onError: (error: Error) => {
        toast.closeAll()
        toast({ description: error.message, status: 'danger' })
      },
    },
  )
}
