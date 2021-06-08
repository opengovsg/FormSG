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
    it('should save returned user to localStorage when successfully fetched', async () => {
      // Arrange
      MockAxios.get.mockResolvedValueOnce({ data: MOCK_USER })

      // Act
      const actual = await UserService.fetchUser()

      // Assert
      expect(actual).toEqual(MOCK_USER)
      expect(MockAxios.get).toHaveBeenLastCalledWith(USER_ENDPOINT)
      expect(localStorage.setItem).toHaveBeenLastCalledWith(
        STORAGE_USER_KEY,
        // Should be stringified.
        JSON.stringify(MOCK_USER),
      )
    })

    it('should return null and save null user to localStorage on API rejection', async () => {
      // Arrange
      MockAxios.get.mockRejectedValueOnce(new Error('something error'))

      // Act
      const actual = await UserService.fetchUser()

      // Assert
      expect(actual).toEqual(null)
      expect(MockAxios.get).toHaveBeenLastCalledWith(USER_ENDPOINT)
      expect(localStorage.setItem).toHaveBeenLastCalledWith(
        STORAGE_USER_KEY,
        'null',
      )
    })
  })
})
