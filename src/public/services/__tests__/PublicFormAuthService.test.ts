import axios from 'axios'
import { mocked } from 'ts-jest/utils'

import { FormAuthType } from '../../../../shared/types'
import * as PublicFormAuthService from '../PublicFormAuthService'

jest.mock('axios')
const MockAxios = mocked(axios, true)

const MOCK_REDIRECT_URL = 'redirectURL'
const MOCK_FORM_ID = 'mock-form-id'

describe('PublicFormAuthService', () => {
  afterEach(() => jest.resetAllMocks())
  describe('createRedirectURL', () => {
    it('should return the redirect URL when retrieval succeeds and persistent login is not set', async () => {
      // Arrange
      const mockData = { redirectURL: MOCK_REDIRECT_URL }
      MockAxios.get.mockResolvedValueOnce({ data: mockData })

      // Act
      const result = await PublicFormAuthService.createRedirectURL(
        MOCK_FORM_ID,
        false,
      )

      // Assert
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${PublicFormAuthService.PUBLIC_FORMS_ENDPOINT}/${MOCK_FORM_ID}/auth/redirect`,
        {
          params: { isPersistentLogin: false },
        },
      )
      expect(result).toEqual(mockData)
    })

    it('should return the redirect URL when retrieval succeeds and persistent login is set', async () => {
      // Arrange
      const mockData = { redirectURL: MOCK_REDIRECT_URL }
      MockAxios.get.mockResolvedValueOnce({ data: mockData })

      // Act
      const result = await PublicFormAuthService.createRedirectURL(
        MOCK_FORM_ID,
        true,
      )

      // Assert
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${PublicFormAuthService.PUBLIC_FORMS_ENDPOINT}/${MOCK_FORM_ID}/auth/redirect`,
        {
          params: { isPersistentLogin: true },
        },
      )
      expect(result).toEqual(mockData)
    })

    it('should return the redirect URL when encodedQuery is set', async () => {
      // Arrange
      const mockData = { redirectURL: MOCK_REDIRECT_URL }
      MockAxios.get.mockResolvedValueOnce({ data: mockData })

      // Act
      const result = await PublicFormAuthService.createRedirectURL(
        MOCK_FORM_ID,
        false,
        'hereIsSomeEncodedData',
      )

      // Assert
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${PublicFormAuthService.PUBLIC_FORMS_ENDPOINT}/${MOCK_FORM_ID}/auth/redirect`,
        {
          params: {
            isPersistentLogin: false,
            encodedQuery: 'hereIsSomeEncodedData',
          },
        },
      )
      expect(result).toEqual(mockData)
    })

    it('should reject with error when API call fails', async () => {
      // Arrange
      const error = new Error('rejected')
      MockAxios.get.mockRejectedValueOnce(error)

      // Act
      const rejectFunction = () =>
        PublicFormAuthService.createRedirectURL(MOCK_FORM_ID)

      // Assert
      await expect(rejectFunction).rejects.toThrow(error)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${PublicFormAuthService.PUBLIC_FORMS_ENDPOINT}/${MOCK_FORM_ID}/auth/redirect`,
        {
          params: { isPersistentLogin: false },
        },
      )
    })
  })

  describe('logoutOfSpcpSession', () => {
    it('should call logout endpoint successfully', async () => {
      const authType = FormAuthType.SP

      const mockData = { message: 'Successfully logged out.' }
      MockAxios.get.mockResolvedValueOnce({ data: mockData })

      const result = await PublicFormAuthService.logoutOfSpcpSession(authType)

      expect(MockAxios.get).toHaveBeenCalledWith(
        `${PublicFormAuthService.PUBLIC_FORMS_ENDPOINT}/auth/${authType}/logout`,
      )
      expect(result).toEqual(mockData)
    })

    it('should return error message if logout fails', async () => {
      const authType = FormAuthType.NIL

      const mockData = { message: 'Invalid authType.' }
      MockAxios.get.mockResolvedValueOnce({ data: mockData })

      const result = await PublicFormAuthService.logoutOfSpcpSession(authType)

      expect(MockAxios.get).toHaveBeenCalledWith(
        `${PublicFormAuthService.PUBLIC_FORMS_ENDPOINT}/auth/${authType}/logout`,
      )
      expect(result).toEqual(mockData)
    })
  })
})
