import axios from 'axios'
import validator from 'validator'

const ADMIN_AUTH_ENDPOINT = '/api/v3/auth'

/**
 * Check whether the given email string is from an email domain.
 * @param email the email to check
 * @returns original email if email is valid
 * @throws Error on invalid email
 * @throws Error on non 2xx response
 */
export const checkIsEmailAllowed = async (email = ''): Promise<string> => {
  if (!validator.isEmail(email)) {
    throw new Error('Please enter a valid email address')
  }

  return axios
    .post(`${ADMIN_AUTH_ENDPOINT}/email/validate`, {
      email: email.toLowerCase(),
    })
    .then(() => email)
    .catch((error) => {
      if (axios.isAxiosError(error) && error.response?.data) {
        throw new Error(error.response.data)
      }
      throw new Error(
        'Something went wrong while validating your email. Please refresh and try again',
      )
    })
}

/**
 * Sends login OTP to given email
 * @param email email to send login OTP to
 * @returns success string if login OTP is sent successfully
 * @throws Error on invalid email
 * @throws Error on non 2xx response
 */
export const sendLoginOtp = async (email = ''): Promise<string> => {
  if (!validator.isEmail(email)) {
    throw new Error('Please enter a valid email address')
  }

  return axios
    .post<string>(`${ADMIN_AUTH_ENDPOINT}/otp/generate`, {
      email: email.toLowerCase(),
    })
    .then(({ data }) => data)
    .catch((error) => {
      if (axios.isAxiosError(error) && error.response?.data) {
        throw new Error(error.response.data)
      }
      throw new Error(
        'Failed to send login OTP. Please try again later and if the problem persists, contact us.',
      )
    })
}
