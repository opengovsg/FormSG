import { Opaque } from 'type-fest'

/** Exported for testing */
export const STORAGE_USER_KEY = 'user'

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
export const saveUserToLocalStorage = (user: User | null): void => {
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
}
