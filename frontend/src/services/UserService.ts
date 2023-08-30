import {
  SendUserContactOtpDto,
  TransferOwnershipRequestDto,
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
): Promise<boolean> => {
  const { email } = request
  return ApiService.post(`${ADMIN_FORM_ENDPOINT}/all-transfer-owner`, {
    email,
  }).then(({ data }) => data)
}
