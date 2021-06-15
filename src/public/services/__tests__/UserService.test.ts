import axios from 'axios'
import { mocked } from 'ts-jest/utils'

import { User } from '../../../types/api/user'
import * as UserService from '../UserService'

const { STORAGE_USER_KEY, USER_ENDPOINT } = UserService

jest.mock('axios')

const MockAxios = mocked(axios, true)

describe('UserService', () => {
  const MOCK_USER: User = {
    _id: 'some id' as User['_id'],
    email: 'mock@example.com',
    agency: {
      _id: 'some agency id' as User['agency']['_id'],
      emailDomain: ['example.com'],
      fullName: 'Example Agency',
      logo: 'path/to/agency/logo',
      shortName: 'e',
    },
    created: 'some created date',
    lastAccessed: 'some last accessed date',
    updatedAt: 'some last updated at date',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserFromLocalStorage', () => {
    it('should return user from localStorage when valid user exists', async () => {
      // Arrange
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(MOCK_USER))

      // Act
      const actual = UserService.getUserFromLocalStorage()

      // Assert
      expect(actual).toEqual(MOCK_USER)
      expect(localStorage.getItem).toHaveBeenLastCalledWith(STORAGE_USER_KEY)
    })

    it('should return null and clear user from localStorage when user is an invalid shape', async () => {
      // Arrange
      localStorage.setItem(
        STORAGE_USER_KEY,
        'this string is obviously not a well formed user',
      )

      // Act
      const actual = UserService.getUserFromLocalStorage()

      // Assert
      expect(localStorage.getItem).toHaveBeenLastCalledWith(STORAGE_USER_KEY)
      expect(actual).toEqual(null)
      expect(localStorage.removeItem).toHaveBeenLastCalledWith(STORAGE_USER_KEY)
    })

    it('should return null and clear user from localStorage when JSON.parse throws', async () => {
      // Arrange
      localStorage.setItem(STORAGE_USER_KEY, '{ invalid JSON string')

      // Act
      const actual = UserService.getUserFromLocalStorage()

      // Assert
      expect(localStorage.getItem).toHaveBeenLastCalledWith(STORAGE_USER_KEY)
      expect(actual).toEqual(null)
      expect(localStorage.removeItem).toHaveBeenLastCalledWith(STORAGE_USER_KEY)
    })
  })

  describe('saveUserToLocalStorage', () => {
    it('should successfully save given user to localStorage', () => {
      // Act
      UserService.saveUserToLocalStorage(MOCK_USER)

      // Assert
      expect(localStorage.setItem).toHaveBeenLastCalledWith(
        STORAGE_USER_KEY,
        // Should be stringified.
        JSON.stringify(MOCK_USER),
      )
    })
  })

  describe('clearUserFromLocalStorage', () => {
    it('should successfully clear user from localStorage', () => {
      // Act
      UserService.clearUserFromLocalStorage()

      // Assert
      expect(localStorage.removeItem).toHaveBeenLastCalledWith(STORAGE_USER_KEY)
    })
  })

  describe('fetchUser', () => {
    it('should return user successfully', async () => {
      // Arrange
      MockAxios.get.mockResolvedValueOnce({ data: MOCK_USER })

      // Act
      const actual = await UserService.fetchUser()

      // Assert
      expect(actual).toEqual(MOCK_USER)
      expect(MockAxios.get).toHaveBeenLastCalledWith(USER_ENDPOINT)
    })
  })
})
