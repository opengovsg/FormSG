import { useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { FormSettings } from '~shared/types/form/form'

import { adminFormKeys } from '../common/queries'

import { getFormSettings } from './SettingsService'

export const adminFormSettingsKeys = {
  base: [...adminFormKeys.base, 'settings'] as const,
  id: (id: string) => [...adminFormSettingsKeys.base, id] as const,
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useAdminFormSettings = (): UseQueryResult<FormSettings> => {
  const { formId } = useParams<{ formId: string }>()
  return useQuery(
    adminFormSettingsKeys.id(formId),
    () => getFormSettings(formId),
    { staleTime: 10 * 60 * 1000 },
  )
}
