import { useQuery, UseQueryOptions, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { AdminFormDto, FormPermissionsDto } from '~shared/types/form/form'

import { ApiError } from '~typings/core'

import {
  getAdminFormView,
  getFormCollaborators,
  getFreeSmsQuota,
} from './AdminViewFormService'

export const adminFormKeys = {
  base: ['adminForm'] as const,
  id: (id: string) => ['adminForm', id] as const,
  freeSmsCount: (id: string) =>
    [...adminFormKeys.id(id), 'freeSmsCount'] as const,
  collaborators: (id: string) =>
    [...adminFormKeys.id(id), 'collaborators'] as const,
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useAdminForm = (
  props?: UseQueryOptions<
    AdminFormDto,
    ApiError,
    AdminFormDto,
    ReturnType<typeof adminFormKeys.id>
  >,
): UseQueryResult<AdminFormDto, ApiError> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return useQuery(
    adminFormKeys.id(formId),
    () => getAdminFormView(formId),
    props,
  )
}

export const useFreeSmsQuota = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return useQuery(adminFormKeys.freeSmsCount(formId), () =>
    getFreeSmsQuota(formId),
  )
}

export const useAdminFormCollaborators = (
  props: UseQueryOptions<
    FormPermissionsDto,
    ApiError,
    FormPermissionsDto,
    ReturnType<typeof adminFormKeys.collaborators>
  >,
): UseQueryResult<FormPermissionsDto, ApiError> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return useQuery(
    adminFormKeys.collaborators(formId),
    () => getFormCollaborators(formId),
    { ...props },
  )
}
