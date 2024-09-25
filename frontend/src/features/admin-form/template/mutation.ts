import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'

import {
  CreateEmailFormBodyDto,
  CreateMultirespondentFormBodyDto,
  CreateStorageFormBodyDto,
  FormDto,
} from '~shared/types'

import { ApiError } from '~typings/core'

import { ADMINFORM_ROUTE } from '~constants/routes'
import { useToast } from '~hooks/useToast'

import { trackCreateFormFailed } from '~features/analytics/AnalyticsService'
import { workspaceKeys } from '~features/workspace/queries'

import {
  createEmailModeTemplateForm,
  createMultirespondentTemplateForm,
  createStorageModeTemplateForm,
} from './TemplateFormService'

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

/**
 * Note: The word "Use" in "useUseTemplateWizardProvider" is not referring to React's "use" convention for hooks.
 * "UseTemplate" is a FormSG functionality referring to the FormSG feature of utilising another form as a starting template.
 */
export const useUseTemplateMutations = () => {
  const { handleSuccess, handleError } = useCommonHooks()

  const useEmailModeFormTemplateMutation = useMutation<
    FormDto,
    ApiError,
    CreateEmailFormBodyDto & { formIdToDuplicate: string }
  >(
    ({ formIdToDuplicate, ...params }) =>
      createEmailModeTemplateForm(formIdToDuplicate, params),
    {
      onSuccess: handleSuccess,
      onError: handleError,
    },
  )

  const useStorageModeFormTemplateMutation = useMutation<
    FormDto,
    ApiError,
    CreateStorageFormBodyDto & {
      formIdToDuplicate: string
    }
  >(
    ({ formIdToDuplicate, ...params }) =>
      createStorageModeTemplateForm(formIdToDuplicate, params),
    {
      onSuccess: handleSuccess,
      onError: handleError,
    },
  )

  const useMultirespondentFormTemplateMutation = useMutation<
    FormDto,
    ApiError,
    CreateMultirespondentFormBodyDto & {
      formIdToDuplicate: string
    }
  >(
    ({ formIdToDuplicate, ...params }) =>
      createMultirespondentTemplateForm(formIdToDuplicate, params),
    {
      onSuccess: handleSuccess,
      onError: handleError,
    },
  )

  return {
    useEmailModeFormTemplateMutation,
    useStorageModeFormTemplateMutation,
    useMultirespondentFormTemplateMutation,
  }
}
