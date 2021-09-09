import { useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { FormSettings } from '~shared/types/form/form'

import { getFormSettings } from './SettingsService'

export const adminFormSettingsKeys = {
  base: ['adminFormSettings'] as const,
  id: (id: string) => [...adminFormSettingsKeys.base, id] as const,
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useAdminFormSettings = (): UseQueryResult<FormSettings> => {
  const { formId } = useParams<{ formId: string }>()
  return useQuery(adminFormSettingsKeys.id(formId), () =>
    getFormSettings(formId),
  )
}
