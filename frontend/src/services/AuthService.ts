import axios from 'axios'

import { UserDto } from '~shared/types/user'

const AUTH_ENDPOINT = '/api/v3/auth'

/**
 * Sends login OTP to given email
 * @param email email to send login OTP to
 * @returns success string if login OTP is sent successfully
 */
export const sendLoginOtp = async (email: string): Promise<string> => {
  return axios
    .post<string>(`${AUTH_ENDPOINT}/otp/generate`, {
      email: email.toLowerCase(),
    })
    .then(({ data }) => data)
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
  return axios
    .post<UserDto>(`${AUTH_ENDPOINT}/otp/verify`, params)
    .then(({ data }) => data)
}

export const logout = async (): Promise<void> => {
  return axios.get(`${AUTH_ENDPOINT}/logout`)
}
