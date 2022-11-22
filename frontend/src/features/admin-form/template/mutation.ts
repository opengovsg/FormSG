import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'

import {
  CreateEmailFormBodyDto,
  CreateStorageFormBodyDto,
  FormDto,
} from '~shared/types'

import { ApiError } from '~typings/core'

import { ADMINFORM_ROUTE } from '~constants/routes'
import { useToast } from '~hooks/useToast'

import { trackCreateFormFailed } from '~features/analytics/AnalyticsService'
import { workspaceKeys } from '~features/workspace/queries'

import {
  dupeEmailModeTemplateForm,
  dupeStorageModeTemplateForm,
} from './TemplateFormService'

const useCommonHooks = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'danger', isClosable: true })

  const handleSuccess = useCallback(
    (data: Pick<FormDto, '_id'>) => {
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
      trackCreateFormFailed()
    },
    [toast],
  )

  return {
    handleSuccess,
    handleError,
  }
}

export const useDuplicateFormTemplateMutations = () => {
  const { handleSuccess, handleError } = useCommonHooks()

  const dupeEmailModeFormTemplateMutation = useMutation<
    FormDto,
    ApiError,
    CreateEmailFormBodyDto & { formIdToDuplicate: string }
  >(
    ({ formIdToDuplicate, ...params }) =>
      dupeEmailModeTemplateForm(formIdToDuplicate, params),
    {
      onSuccess: handleSuccess,
      onError: handleError,
    },
  )

  const dupeStorageModeFormTemplateMutation = useMutation<
    FormDto,
    ApiError,
    CreateStorageFormBodyDto & { formIdToDuplicate: string }
  >(
    ({ formIdToDuplicate, ...params }) =>
      dupeStorageModeTemplateForm(formIdToDuplicate, params),
    {
      onSuccess: handleSuccess,
      onError: handleError,
    },
  )

  return {
    dupeEmailModeFormTemplateMutation,
    dupeStorageModeFormTemplateMutation,
  }
}
