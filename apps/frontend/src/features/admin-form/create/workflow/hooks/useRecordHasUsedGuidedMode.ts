import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { FormResponseMode, FormSettings } from 'formsg-shared/types'

import {
  adminFormKeys,
  useAdminForm,
} from '~features/admin-form/common/queries'
import { adminFormSettingsKeys } from '~features/admin-form/settings/queries'
import { updateMrfHasUsedGuidedMode } from '~features/admin-form/settings/SettingsService'

export const useRecordHasUsedGuidedMode = (): (() => void) => {
  const { formId } = useParams()
  const queryClient = useQueryClient()
  const { data: form } = useAdminForm()

  const { mutate } = useMutation(
    () =>
      updateMrfHasUsedGuidedMode(String(formId), { hasUsedGuidedMode: true }),
    {
      onSuccess: (newData: FormSettings) => {
        queryClient.setQueryData(
          adminFormSettingsKeys.id(String(formId)),
          newData,
        )
        queryClient.setQueryData<FormSettings | undefined>(
          adminFormKeys.id(String(formId)),
          (oldData) => (oldData ? { ...oldData, ...newData } : undefined),
        )
      },
    },
  )

  return useCallback(() => {
    if (!formId) return
    if (form?.responseMode !== FormResponseMode.Multirespondent) return
    if (form.hasUsedGuidedMode) return
    mutate()
  }, [formId, form, mutate])
}
