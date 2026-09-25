import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { FormSavedViewInput } from 'formsg-shared/types'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'
import { createFormSavedView } from '~features/admin-form/responses/AdminSubmissionsService'

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
