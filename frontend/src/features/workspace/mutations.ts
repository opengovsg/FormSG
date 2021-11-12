import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'

import { CreateEmailFormBodyDto, FormDto } from '~shared/types/form/form'

import { ApiError } from '~typings/core'

import { ADMINFORM_ROUTE } from '~constants/routes'
import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'

import { createEmailModeForm } from './WorkspaceService'

export const useCreateFormMutations = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'danger', isClosable: true })

  const createEmailModeFormMutation = useMutation<
    FormDto,
    ApiError,
    CreateEmailFormBodyDto
  >((params) => createEmailModeForm(params), {
    onSuccess: (data) => {
      queryClient.setQueryData(adminFormKeys.id(data._id), data)
      navigate(`${ADMINFORM_ROUTE}/${data._id}`)
    },
    onError: (error) => {
      toast({
        description: error.message,
      })
    },
  })

  return {
    createEmailModeFormMutation,
  }
}
