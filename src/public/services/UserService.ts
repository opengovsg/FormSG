import { User } from '../../types/api/user'

/** Exported for testing */
export const STORAGE_USER_KEY = 'user'

/**
 * Save logged in user to localStorage.
 * May not be needed in React depending on implementation.
 *
 * @param user the user to save to local storage
 */
export const saveUserToLocalStorage = (user: User | null): void => {
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
}
