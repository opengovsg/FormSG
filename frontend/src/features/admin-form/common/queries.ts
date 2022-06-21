import { useMemo } from 'react'
import { useQuery, UseQueryOptions, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { AdminFormDto } from '~shared/types/form/form'

import { ApiError } from '~typings/core'

import { useUser } from '~features/user/queries'

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
  endPage: (id: string) => [...adminFormKeys.id(id), 'endPage'] as const,
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

export const useAdminFormCollaborators = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { user, isLoading: isUserLoading } = useUser()
  const { data: form, isLoading: isAdminFormLoading } = useAdminForm()

  const { data: collaborators, isLoading: isCollabLoading } = useQuery(
    adminFormKeys.collaborators(formId),
    () => getFormCollaborators(formId),
    { enabled: !!form },
  )

  const isFormAdmin = useMemo(
    () => !!user && !!form && user.email === form.admin.email,
    [form, user],
  )

  const showEditableModal = useMemo(() => {
    if (!form || !user) return false
    if (isFormAdmin) return true
    // Collaborators is source of truth if it has already loaded.
    if (collaborators) {
      return collaborators.some(
        (perms) => perms.write && perms.email === user.email,
      )
    }
    // Else use permissionList first
    return form.permissionList.some(
      (perms) => perms.write && perms.email === user.email,
    )
  }, [collaborators, form, isFormAdmin, user])

  return {
    user,
    form,
    collaborators,
    isLoading: isCollabLoading || isAdminFormLoading || isUserLoading,
    isFormAdmin,
    showEditableModal,
  }
}
