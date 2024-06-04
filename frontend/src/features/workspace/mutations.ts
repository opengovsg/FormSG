import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'

import { AdminFeedbackRating } from '~shared/types'
import {
  CreateEmailFormBodyDto,
  CreateMultirespondentFormBodyDto,
  CreateStorageFormBodyDto,
  DuplicateFormBodyDto,
  FormDto,
  FormId,
} from '~shared/types/form/form'

import { ApiError } from '~typings/core'

import { ADMINFORM_ROUTE } from '~constants/routes'
import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'
import { trackCreateFormFailed } from '~features/analytics/AnalyticsService'

import { workspaceKeys } from './queries'
import {
  createAdminFeedback,
  createEmailModeForm,
  createMultirespondentModeForm,
  createStorageModeForm,
  createWorkspace,
  deleteAdminForm,
  deleteWorkspace,
  dupeEmailModeForm,
  dupeMultirespondentModeForm,
  dupeStorageModeForm,
  moveFormsToWorkspace,
  removeFormsFromWorkspaces,
  updateAdminFeedback,
  updateWorkspaceTitle,
} from './WorkspaceService'

const useCommonHooks = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'danger', isClosable: true })

  const handleSuccess = useCallback(
    (data: Pick<FormDto, '_id'>) => {
      queryClient.invalidateQueries(workspaceKeys.dashboard)
      queryClient.invalidateQueries(workspaceKeys.workspaces)
      navigate(`${ADMINFORM_ROUTE}/${data._id}`)
    },
    [navigate, queryClient],
  )

  const handleError = useCallback(
    (error: ApiError) => {
      toast({
        description: error.message,
      })
      trackCreateFormFailed()
    },
    [toast],
  )

  return {
    handleSuccess,
    handleError,
  }
}

export const useCreateFormMutations = () => {
  const { handleSuccess, handleError } = useCommonHooks()

  const createEmailModeFormMutation = useMutation<
    FormDto,
    ApiError,
    CreateEmailFormBodyDto
  >((params) => createEmailModeForm(params), {
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const createStorageModeFormMutation = useMutation<
    FormDto,
    ApiError,
    CreateStorageFormBodyDto
  >((params) => createStorageModeForm(params), {
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const createMultirespondentModeFormMutation = useMutation<
    FormDto,
    ApiError,
    CreateMultirespondentFormBodyDto
  >((params) => createMultirespondentModeForm(params), {
    onSuccess: handleSuccess,
    onError: handleError,
  })

  return {
    createEmailModeFormMutation,
    createStorageModeFormMutation,
    createMultirespondentModeFormMutation,
  }
}

export const useDuplicateFormMutations = () => {
  const { handleSuccess, handleError } = useCommonHooks()

  const dupeEmailModeFormMutation = useMutation<
    FormDto,
    ApiError,
    DuplicateFormBodyDto & { formIdToDuplicate: FormId }
  >(
    ({ formIdToDuplicate, ...params }) =>
      dupeEmailModeForm(formIdToDuplicate, params),
    {
      onSuccess: handleSuccess,
      onError: handleError,
    },
  )

  const dupeStorageModeFormMutation = useMutation<
    FormDto,
    ApiError,
    DuplicateFormBodyDto & { formIdToDuplicate: FormId }
  >(
    ({ formIdToDuplicate, ...params }) =>
      dupeStorageModeForm(formIdToDuplicate, params),
    {
      onSuccess: handleSuccess,
      onError: handleError,
    },
  )

  const dupeMultirespondentModeFormMutation = useMutation<
    FormDto,
    ApiError,
    DuplicateFormBodyDto & { formIdToDuplicate: FormId }
  >(
    ({ formIdToDuplicate, ...params }) =>
      dupeMultirespondentModeForm(formIdToDuplicate, params),
    {
      onSuccess: handleSuccess,
      onError: handleError,
    },
  )

  return {
    dupeEmailModeFormMutation,
    dupeStorageModeFormMutation,
    dupeMultirespondentModeFormMutation,
  }
}

export const useDeleteFormMutation = () => {
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'danger', isClosable: true })

  const handleSuccess = useCallback(
    (formId: string) => {
      queryClient.invalidateQueries(adminFormKeys.id(formId))
      queryClient.invalidateQueries(workspaceKeys.dashboard)
      queryClient.invalidateQueries(workspaceKeys.workspaces)
      toast({
        status: 'success',
        description: 'The form has been successfully deleted.',
      })
    },
    [queryClient, toast],
  )

  const handleError = useCallback(
    (error: ApiError) => {
      toast({
        description: error.message,
      })
    },
    [toast],
  )

  const deleteFormMutation = useMutation(
    (formId: FormId) => deleteAdminForm(formId),
    {
      onSuccess: (_, formId) => handleSuccess(formId),
      onError: handleError,
    },
  )

  return { deleteFormMutation }
}
export const useAdminFeedbackMutation = () => {
  const createAdminFeedbackMutation = useMutation(
    (rating: AdminFeedbackRating) => createAdminFeedback(rating),
  )
  const updateAdminFeedbackMutation = useMutation(
    ({ feedbackId, comment }: { feedbackId: string; comment: string }) =>
      updateAdminFeedback(feedbackId, comment),
  )

  return { createAdminFeedbackMutation, updateAdminFeedbackMutation }
}

export const useWorkspaceMutations = () => {
  const queryClient = useQueryClient()

  const toast = useToast({ isClosable: true })

  const handleSuccess = useCallback(
    (description: string) => {
      queryClient.invalidateQueries(workspaceKeys.workspaces)
      toast({
        description: description,
      })
    },
    [toast, queryClient],
  )

  const handleError = useCallback(
    (error: ApiError) => {
      toast({
        description: error.message,
      })
    },
    [toast],
  )
  const createWorkspaceMutation = useMutation(
    (params: { title: string }) => createWorkspace(params),
    {
      onSuccess: () => handleSuccess('New folder created.'),
      onError: handleError,
    },
  )

  const moveWorkspaceMutation = useMutation(
    (params: {
      formIds: FormId[]
      destWorkspaceId: string
      destWorkspaceTitle: string
    }) => moveFormsToWorkspace(params),
    {
      onSuccess: (_, { destWorkspaceTitle }) =>
        handleSuccess(`Your form was moved to ${destWorkspaceTitle}`),
      onError: handleError,
    },
  )

  const updateWorkspaceTitleMutation = useMutation(
    (params: { title: string; destWorkspaceId: string }) =>
      updateWorkspaceTitle(params),
    {
      onSuccess: () => handleSuccess('Your folder has been renamed'),
      onError: handleError,
    },
  )

  const deleteWorkspaceMutation = useMutation(
    (params: { destWorkspaceId: string }) => deleteWorkspace(params),
    {
      onSuccess: () => handleSuccess('Your folder has been deleted'),
      onError: handleError,
    },
  )

  // to remove a singular form mutation
  // can be extended to remove multiple forms from workspaces
  const removeFormFromWorkspacesMutation = useMutation(
    (params: { formId: FormId }) =>
      removeFormsFromWorkspaces({ formIds: [params.formId] }),
    {
      onSuccess: () =>
        handleSuccess('Your form has been removed from the folder'),
      onError: handleError,
    },
  )

  return {
    createWorkspaceMutation,
    moveWorkspaceMutation,
    updateWorkspaceTitleMutation,
    deleteWorkspaceMutation,
    removeFormFromWorkspacesMutation,
  }
}
