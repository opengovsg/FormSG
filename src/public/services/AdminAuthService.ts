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
    .post(`${ADMIN_AUTH_ENDPOINT}/email/validate`, { email })
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
