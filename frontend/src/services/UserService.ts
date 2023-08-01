import { AdminDashboardFormMetaDto, AdminFormViewDto } from '~shared/types'
import {
  SendUserContactOtpDto,
  TransferOwnershipRequestDto,
  TransferOwnershipResponseDto,
  UserDto,
  VerifyUserContactOtpDto,
} from '~shared/types/user'

import { ApiService } from './ApiService'

const ADMIN_FORM_ENDPOINT = '/admin/forms'
const USER_ENDPOINT = '/user'

/**
 * Fetches the user from the server using the current session cookie.
 *
 * @returns the logged in user if session is valid, will throw 401 error if not.
 */
export const fetchUser = async (): Promise<UserDto> => {
  return ApiService.get<UserDto>(USER_ENDPOINT).then(({ data }) => data)
}

export const generateUserContactOtp = (
  params: SendUserContactOtpDto,
): Promise<void> => {
  return ApiService.post(`${USER_ENDPOINT}/contact/otp/generate`, params)
}

export const verifyUserContactOtp = (
  params: VerifyUserContactOtpDto,
): Promise<UserDto> => {
  return ApiService.post<UserDto>(
    `${USER_ENDPOINT}/contact/otp/verify`,
    params,
  ).then(({ data }) => data)
}

export const updateUserLastSeenFeatureUpdateVersion = async (
  version: number,
): Promise<UserDto> => {
  return ApiService.post<UserDto>(
    `${USER_ENDPOINT}/flag/new-features-last-seen`,
    { version },
  ).then(({ data }) => data)
}

export const transferOwnership = async (
  request: TransferOwnershipRequestDto,
): Promise<TransferOwnershipResponseDto> => {
  const { email } = request
  const ownedFormIds = await ApiService.get<AdminDashboardFormMetaDto[]>(
    `${ADMIN_FORM_ENDPOINT}/owned`,
  ).then(({ data }) => {
    if (!Array.isArray(data) || !data.length) {
      return Promise.reject(
        new Error(
          'Failed to transfer ownership because no owned forms were found.',
        ),
      )
    }
    return data.map((formMetaDto) => formMetaDto._id)
  })
  return Promise.all(
    ownedFormIds.map((formId: string) => {
      return ApiService.post<AdminFormViewDto>(
        `${ADMIN_FORM_ENDPOINT}/${formId}/collaborators/transfer-owner`,
        { email },
      )
    }),
  ).then((responses) => {
    const formIds = responses.map((response) => response.data.form._id)
    return {
      email,
      formIds,
      error: '',
    }
  })
}
