import {
  GetSgidAuthUrlResponseDto,
  SendOtpResponseDto,
  UserDto,
} from '~shared/types/user'

import { LOCAL_STORAGE_EVENT, LOGGED_IN_KEY } from '~constants/localStorage'

import { ApiService } from './ApiService'

const AUTH_ENDPOINT = '/auth'

/**
 * Sends login OTP to given email
 * @param email email to send login OTP to
 * @returns success string if login OTP is sent successfully
 */
export const sendLoginOtp = async (
  email: string,
): Promise<SendOtpResponseDto> => {
  return ApiService.post<SendOtpResponseDto>(`${AUTH_ENDPOINT}/otp/generate`, {
    email: email.toLowerCase(),
  }).then(({ data }) => data)
}

/**
 * Verifies the login OTP and returns the user if OTP is valid.
 * @param params.email the email to verify
 * @param params.otp the OTP sent to the given email to verify
 * @returns logged in user when successful
 * @throws Error on non 2xx response
 */
export const verifyLoginOtp = async (params: {
  otp: string
  email: string
}): Promise<UserDto> => {
  return ApiService.post<UserDto>(`${AUTH_ENDPOINT}/otp/verify`, params).then(
    ({ data }) => data,
  )
}

/**
 * Gets the SGID authentication endpoint URL
 * @returns SGID login redirect url
 * @throws Error on non 2xx response
 */
export const getSgidAuthUrl = async (): Promise<GetSgidAuthUrlResponseDto> => {
  return ApiService.get<GetSgidAuthUrlResponseDto>(
    `${AUTH_ENDPOINT}/sgid/authurl`,
  ).then(({ data }) => data)
}

export const logout = async (): Promise<void> => {
  // Remove logged in state from localStorage
  localStorage.removeItem(LOGGED_IN_KEY)
  // Event to let useLocalStorage know that key is being deleted.
  window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT))
  return ApiService.get(`${AUTH_ENDPOINT}/logout`)
}
