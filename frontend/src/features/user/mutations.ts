import { useMutation, useQueryClient } from 'react-query'

import {
  SendUserContactOtpDto,
  TransferOwnershipRequestDto,
  UserDto,
  VerifyUserContactOtpDto,
} from '~shared/types/user'

import { ApiError } from '~typings/core'

import { useToast } from '~hooks/useToast'
import {
  generateUserContactOtp,
  transferOwnership,
  updateUserLastSeenFeatureUpdateVersion,
  verifyUserContactOtp,
} from '~services/UserService'

import { userKeys } from './queries'

export const useUserMutations = () => {
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })
  // FIXME: Is this an acceptable way to define another toast in the same scope?
  const failureToast = useToast({ status: 'danger', isClosable: true })

  const generateOtpMutation = useMutation<
    void,
    ApiError,
    SendUserContactOtpDto
  >((params) => generateUserContactOtp(params))

  const verifyOtpMutation = useMutation<
    UserDto,
    ApiError,
    VerifyUserContactOtpDto
  >((params) => verifyUserContactOtp(params), {
    onSuccess: (data) => {
      queryClient.setQueryData(userKeys.base, data)
      toast({
        description: 'Emergency contact added.',
      })
    },
  })

  const updateLastSeenFeatureVersionMutation = useMutation<
    UserDto,
    ApiError,
    number
  >((version: number) => updateUserLastSeenFeatureUpdateVersion(version), {
    onSuccess: (newData) => {
      queryClient.setQueryData(userKeys.base, newData)
    },
  })

  const transferOwnershipMutation = useMutation(
    (params: TransferOwnershipRequestDto) => transferOwnership(params),
    {
      onSuccess: (_) => {
        toast({
          description: 'Ownership transferred.',
        })
      },
      onError: (error: ApiError) => {
        failureToast({
          description: error.message,
        })
      },
    },
  )

  return {
    generateOtpMutation,
    verifyOtpMutation,
    updateLastSeenFeatureVersionMutation,
    transferOwnershipMutation,
  }
}
