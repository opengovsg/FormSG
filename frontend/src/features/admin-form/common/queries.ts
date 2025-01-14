import { useMemo } from 'react'
import { useQuery, UseQueryOptions, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { Product } from '~shared/types'
import { AdminFormDto, PreviewFormViewDto } from '~shared/types/form/form'

import { ApiError } from '~typings/core'

import { MONGODB_ID_REGEX } from '~constants/routes'

import { useUser } from '~features/user/queries'

import {
  getAdminFormView,
  getFormCollaborators,
  previewForm,
  viewFormTemplate,
} from './AdminViewFormService'

export const adminFormKeys = {
  base: ['adminForm'] as const,
  id: (id: string) => ['adminForm', id] as const,
  collaborators: (id: string) =>
    [...adminFormKeys.id(id), 'collaborators'] as const,
  previewForm: (id: string) =>
    [...adminFormKeys.id(id), 'previewForm'] as const,
  viewFormTemplate: (id: string) =>
    [...adminFormKeys.id(id), 'viewFormTemplate'] as const,
  products: (id: string, products: Product[]) =>
    [...adminFormKeys.id(id), 'products', ...products] as const,
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
  if (!formId) throw new Error('No formId provided to useAdminForm')

  return useAdminFormWithId(formId, props)
}

export const useAdminFormWithId = (
  formId: string,
  props?: UseQueryOptions<
    AdminFormDto,
    ApiError,
    AdminFormDto,
    ReturnType<typeof adminFormKeys.id>
  >,
): UseQueryResult<AdminFormDto, ApiError> => {
  return useQuery(
    adminFormKeys.id(formId),
    () => getAdminFormView(formId),
    props,
  )
}

/**
 * @params formId - The formId of the form to get the collaborators for.
 * Params required as formId may come from various sources, either via url params
 * or a context.
 */
export const useAdminFormCollaborators = (formId: string) => {
  const { user, isLoading: isUserLoading } = useUser()
  const { data: form, isLoading: isAdminFormLoading } =
    useAdminFormWithId(formId)

  const { data: collaborators, isLoading: isCollabLoading } = useQuery(
    adminFormKeys.collaborators(formId),
    () => getFormCollaborators(formId),
    { enabled: !!form },
  )

  const isFormAdmin = useMemo(
    () => !!user && !!form && user.email === form.admin.email,
    [form, user],
  )

  const hasEditAccess = useMemo(() => {
    if (!form || !user) return false
    if (isFormAdmin) return true
    // Collaborators is source of truth if it has already loaded.
    if (collaborators) {
      return collaborators.some(
        (perms) =>
          perms.write && perms.email.toLowerCase() === user.email.toLowerCase(),
      )
    }
    // Else use permissionList first
    return form.permissionList.some(
      (perms) =>
        perms.write && perms.email.toLowerCase() === user.email.toLowerCase(),
    )
  }, [collaborators, form, isFormAdmin, user])

  return {
    user,
    form,
    collaborators,
    isLoading: isCollabLoading || isAdminFormLoading || isUserLoading,
    isFormAdmin,
    hasEditAccess,
  }
}

export const usePreviewForm = (
  formId: string,
  /** Extra override to determine whether query is enabled */
  enabled = true,
): UseQueryResult<PreviewFormViewDto, ApiError> => {
  return useQuery(
    adminFormKeys.previewForm(formId),
    () => previewForm(formId),
    {
      // Treat preview form as static on load.
      staleTime: Infinity,
      enabled: MONGODB_ID_REGEX.test(formId) && enabled,
    },
  )
}

export const useFormTemplate = (
  formId: string,
  /** Extra override to determine whether query is enabled */
  enabled = true,
): UseQueryResult<PreviewFormViewDto, ApiError> => {
  return useQuery(
    adminFormKeys.viewFormTemplate(formId),
    () => viewFormTemplate(formId),
    {
      // Treat preview form as static on load.
      staleTime: Infinity,
      enabled: MONGODB_ID_REGEX.test(formId) && enabled,
    },
  )
}
