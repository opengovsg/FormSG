import axios from 'axios'
import { Opaque } from 'type-fest'

// Exported for testing.
export const AUTH_ENDPOINT = '/api/v3/auth'

const STORAGE_USER_KEY = 'user'

type UserId = Opaque<string, 'UserId'>
type AgencyId = Opaque<string, 'AgencyId'>

export type Agency = {
  emailDomain: string[]
  fullName: string
  shortName: string
  logo: string
  _id: AgencyId
}

export type User = {
  _id: UserId
  email: string
  agency: Agency
  created: string
  lastAccessed: string
  updatedAt: string
}

/**
 * Save logged in user to localStorage.
 * May not be needed in React depending on implementation.
 *
 * @param user the user to save to local storage
 */
const saveUserToLocalStorage = (user: User) => {
  return localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
}

type Email = Opaque<string, 'Email'>

/**
 * Check whether the given email string is from a whitelisted email domain.
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
 */
export const sendLoginOtp = async (email: Email): Promise<string> => {
  return axios
    .post<string>(`${AUTH_ENDPOINT}/otp/generate`, {
      email: email.toLowerCase(),
    })
    .then(({ data }) => data)
}

/**
 * Verifies the login OTP and saves the returned user to localStorage if OTP is
 * valid.
 * @param params.email the email to verify
 * @param params.otp the OTP sent to the given email to verify
 * @returns logged in user when successful
 * @throws Error on non 2xx response
 */
export const verifyLoginOtp = async (params: {
  otp: string
  email: string
}): Promise<User> => {
  return axios
    .post<User>(`${AUTH_ENDPOINT}/otp/verify`, params)
    .then(({ data }) => {
      saveUserToLocalStorage(data)
      return data
    })
}
