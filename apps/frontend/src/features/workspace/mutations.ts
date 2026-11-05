import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'

import { AdminCsatScore, AdminFeedbackTriggerSource } from 'formsg-shared/types'
import {
  CreateMultirespondentFormBodyDto,
  CreateStorageFormBodyDto,
  DuplicateFormBodyDto,
  FormDto,
  FormId,
} from 'formsg-shared/types/form/form'

import { ApiError } from '~typings/core'

import { ADMINFORM_ROUTE } from '~constants/routes'
import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'
import { trackCreateFormFailed } from '~features/analytics/AnalyticsService'

import { workspaceKeys } from './queries'
import {
  createAdminFeedback,
  createMultirespondentModeForm,
  createStorageModeForm,
  createWorkspace,
  deleteAdminForm,
  deleteWorkspace,
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

  const handleSuccessWithoutRedirect = useCallback(
    (data: FormDto) => {
      queryClient.invalidateQueries(workspaceKeys.dashboard)
      queryClient.invalidateQueries(workspaceKeys.workspaces)
      return data
    },
    [queryClient],
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
    handleSuccessWithoutRedirect,
    handleError,
  }
}

export const useCreateFormMutations = () => {
  const { handleError, handleSuccessWithoutRedirect } = useCommonHooks()

  const queryClient = useQueryClient()

  const createStorageModeFormMutation = useMutation<
    FormDto,
    ApiError,
    CreateStorageFormBodyDto
  >((params) => createStorageModeForm(params), {
    onSuccess: (data) => {
      handleSuccessWithoutRedirect(data)
      queryClient.setQueryData(workspaceKeys.lastCreatedForm, data._id)
    },
    onError: handleError,
  })

  const createMultirespondentModeFormMutation = useMutation<
    FormDto,
    ApiError,
    CreateMultirespondentFormBodyDto
  >((params) => createMultirespondentModeForm(params), {
    onSuccess: (data) => {
      handleSuccessWithoutRedirect(data)
      queryClient.setQueryData(workspaceKeys.lastCreatedForm, data._id)
    },
    onError: handleError,
  })

  return {
    createStorageModeFormMutation,
    createMultirespondentModeFormMutation,
  }
}

export const useDuplicateFormMutations = () => {
  const { handleSuccessWithoutRedirect, handleError } = useCommonHooks()

  const queryClient = useQueryClient()

  const dupeStorageModeFormMutation = useMutation<
    FormDto,
    ApiError,
    DuplicateFormBodyDto & { formIdToDuplicate: FormId }
  >(
    ({ formIdToDuplicate, ...params }) =>
      dupeStorageModeForm(formIdToDuplicate, params),
    {
      onSuccess: (data) => {
        handleSuccessWithoutRedirect(data)
        queryClient.setQueryData(workspaceKeys.lastCreatedForm, data._id)
      },
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
      onSuccess: (data) => {
        handleSuccessWithoutRedirect(data)
        queryClient.setQueryData(workspaceKeys.lastCreatedForm, data._id)
      },
      onError: handleError,
    },
  )

  return {
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
    ({
      csat,
      triggerSource,
      formId,
      comment,
    }: {
      csat: AdminCsatScore
      triggerSource?: AdminFeedbackTriggerSource
      formId?: string
      comment?: string
    }) => createAdminFeedback(csat, triggerSource, formId, comment),
  )
  const updateAdminFeedbackMutation = useMutation(
    ({
      feedbackId,
      comment,
      csat,
    }: {
      feedbackId: string
      comment?: string
      csat?: AdminCsatScore
    }) => updateAdminFeedback(feedbackId, { comment, csat }),
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
