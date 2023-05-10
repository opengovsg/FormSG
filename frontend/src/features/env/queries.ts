import { useQuery, UseQueryResult } from 'react-query'

import { PublicFormViewDto } from '~shared/types'
import { ClientEnvVars } from '~shared/types/core'

import { ApiError } from '~typings/core'

import { getClientEnvVars, getFeedbackFormView } from './EnvService'

const envKeys = {
  base: ['env'],
  adminFeedbackForm: ['adminFeedbackForm'] as const,
  publicFeedbackForm: ['publicFeedbackForm'] as const,
}

export const useEnv = (
  enabled = true,
): UseQueryResult<ClientEnvVars, unknown> => {
  return useQuery<ClientEnvVars>(envKeys.base, () => getClientEnvVars(), {
    enabled,
  })
}

// TODO #4279: Remove after React rollout is complete
export const useAdminFeedbackFormView = (
  /** Extra override to determine whether query is enabled */
  enabled = true,
): UseQueryResult<PublicFormViewDto, ApiError> => {
  return useQuery<PublicFormViewDto, ApiError>(
    envKeys.adminFeedbackForm,
    () => getFeedbackFormView(/* admin = */ true),
    { enabled },
  )
}

export const usePublicFeedbackFormView = (
  /** Extra override to determine whether query is enabled */
  enabled = true,
): UseQueryResult<PublicFormViewDto, ApiError> => {
  return useQuery<PublicFormViewDto, ApiError>(
    envKeys.publicFeedbackForm,
    () => getFeedbackFormView(/* admin = */ false),
    { enabled },
  )
}
