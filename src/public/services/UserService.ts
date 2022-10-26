import axios from 'axios'

import { UserDto } from '../../../shared/types'

/** Exported for testing */
export const STORAGE_USER_KEY = 'user'
// For React redirect compatibility
export const LOGGED_IN_KEY = 'is-logged-in'
/** Exported for testing */
export const USER_ENDPOINT = '/api/v3/user'

/**
 * Get logged in user from localStorage.
 * May not be needed in React depending on implementation.
 *
 * @returns user if available, null otherwise
 */
export const getUserFromLocalStorage = (): UserDto | null => {
  const userStringified = localStorage.getItem(STORAGE_USER_KEY)

  if (userStringified) {
    localStorage.setItem(LOGGED_IN_KEY, 'true')
    try {
      return UserDto.parse(JSON.parse(userStringified))
    } catch (error) {
      // Invalid shape, clear from storage.
      clearUserFromLocalStorage()
      return null
    }
  }
  return null
}

/**
 * Save logged in user to localStorage.
 * May not be needed in React depending on implementation.
 *
 * @param user the user to save to local storage
 */
export const saveUserToLocalStorage = (user: UserDto): void => {
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
  localStorage.setItem(LOGGED_IN_KEY, 'true')
}

/**
 * Clear logged in user from localStorage.
 * May not even be needed in React depending on implementation.
 */
export const clearUserFromLocalStorage = (): void => {
  localStorage.removeItem(STORAGE_USER_KEY)
  localStorage.removeItem(LOGGED_IN_KEY)
}

/**
 * Fetches the user from the server using the current session cookie.
 *
 * Side effect: On success, save the retrieved user to localStorage.
 * Side effect: On error, clear the user (if any) from localStorage.
 * @returns the logged in user if session is valid, `null` otherwise
 */
export const fetchUser = async (): Promise<UserDto | null> => {
  return axios.get<UserDto>(USER_ENDPOINT).then(({ data }) => data)
}
