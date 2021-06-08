import axios from 'axios'

import { User } from '../../types/api/user'

/** Exported for testing */
export const STORAGE_USER_KEY = 'user'
/** Exported for testing */
export const USER_ENDPOINT = '/api/v3/user'

/**
 * Save logged in user to localStorage.
 * May not be needed in React depending on implementation.
 *
 * @param user the user to save to local storage
 */
export const saveUserToLocalStorage = (user: User): void => {
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
}

/**
 * Clear logged in user from localStorage.
 * May not even be needed in React depending on implementation.
 */
export const clearUserFromLocalStorage = (): void => {
  localStorage.removeItem(STORAGE_USER_KEY)
}

/**
 * Fetches the user from the server using the current session cookie.
 *
 * Side effect: Saves the retrieved user to localStorage
 * @returns the logged in user if session is valid, `null` otherwise
 */
export const fetchUser = async (): Promise<User | null> => {
  return axios
    .get<User>(USER_ENDPOINT)
    .then(({ data: user }) => {
      saveUserToLocalStorage(user)
      return user
    })
    .catch(() => {
      saveUserToLocalStorage(null)
      return null
    })
}
