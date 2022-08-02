import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'

import {
  CreateEmailFormBodyDto,
  CreateStorageFormBodyDto,
  FormDto,
} from '~shared/types/form/form'

import { ApiError } from '~typings/core'

import { ADMINFORM_ROUTE } from '~constants/routes'
import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'

import { workspaceKeys } from './queries'
import { createEmailModeForm, createStorageModeForm } from './WorkspaceService'

export const useCreateFormMutations = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'danger', isClosable: true })

  const handleSuccess = useCallback(
    (data: FormDto) => {
      queryClient.setQueryData(adminFormKeys.id(data._id), data)
      queryClient.invalidateQueries(workspaceKeys.all)
      navigate(`${ADMINFORM_ROUTE}/${data._id}`)
    },
    [navigate, queryClient],
  )

  const handleError = useCallback(
    (error: ApiError) => {
      toast({
        description: error.message,
      })
    },
    [toast],
  )

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

  return {
    createEmailModeFormMutation,
    createStorageModeFormMutation,
  }
}
