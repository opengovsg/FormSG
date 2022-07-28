import { useQuery, UseQueryResult } from 'react-query'

import { PublicFormViewDto } from '~shared/types'
import { ClientEnvVars } from '~shared/types/core'

import { ApiError } from '~typings/core'

import { getClientEnvVars, getSwitchEnvFormView } from './EnvService'

const envKeys = {
  base: ['env'],
  viewSwitchEnvForm: ['viewSwitchEnvForm'] as const,
}

export const useEnv = (
  enabled = true,
): UseQueryResult<ClientEnvVars, unknown> => {
  return useQuery<ClientEnvVars>(envKeys.base, () => getClientEnvVars(), {
    enabled,
  })
}

// TODO #4279: Remove after React rollout is complete
export const useSwitchEnvFeedbackFormView = (
  /** Extra override to determine whether query is enabled */
  enabled = true,
): UseQueryResult<PublicFormViewDto, ApiError> => {
  return useQuery<PublicFormViewDto, ApiError>(envKeys.viewSwitchEnvForm, () =>
    getSwitchEnvFormView(),
  )
}
