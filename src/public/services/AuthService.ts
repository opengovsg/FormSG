import axios from 'axios'
import { Opaque } from 'type-fest'

const AUTH_ENDPOINT = '/api/v3/auth'

type Email = Opaque<string, 'Email'>

/**
 * Check whether the given email string is from an email domain.
 * @param email the email to check
 * @returns original email if email is valid
 */
export const checkIsEmailAllowed = async (email: string): Promise<Email> => {
  return axios
    .post(`${AUTH_ENDPOINT}/email/validate`, {
      email: email.toLowerCase(),
    })
    .then(() => email as Email)
}

/**
 * Sends login OTP to given email
 * @param email email to send login OTP to
 * @returns success string if login OTP is sent successfully
 * @throws Error on invalid email
 * @throws Error on non 2xx response
 */
export const sendLoginOtp = async (email: Email): Promise<string> => {
  return axios
    .post<string>(`${AUTH_ENDPOINT}/otp/generate`, {
      email: email.toLowerCase(),
    })
    .then(({ data }) => data)
}
