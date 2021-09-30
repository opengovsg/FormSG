import { useMutation, useQueryClient } from 'react-query'

import {
  SendUserContactOtpDto,
  VerifyUserContactOtpDto,
} from '~shared/types/user'

import {
  generateUserContactOtp,
  verifyUserContactOtp,
} from '~services/UserService'

import { userKeys } from './queries'

export const useUserMutations = () => {
  const queryClient = useQueryClient()

  const generateOtpMutation = useMutation((params: SendUserContactOtpDto) =>
    generateUserContactOtp(params),
  )

  const verifyOtpMutation = useMutation(
    (params: VerifyUserContactOtpDto) => verifyUserContactOtp(params),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(userKeys.base, data)
      },
    },
  )

  return {
    generateOtpMutation,
    verifyOtpMutation,
  }
}
