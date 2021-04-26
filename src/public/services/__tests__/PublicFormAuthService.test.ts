import axios from 'axios'
import { ObjectId } from 'bson'
import { mocked } from 'ts-jest/utils'

import * as PublicFormAuthService from '../PublicFormAuthService'

jest.mock('axios')
const MockAxios = mocked(axios, true)

const MOCK_REDIRECT_URL = 'redirectURL'
const MOCK_FORM_ID = new ObjectId().toHexString()

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

    it('should reject with error when API call fails', async () => {
      // Arrange
      const error = new Error('rejected')
      MockAxios.get.mockRejectedValueOnce(error)

      // Act
      const rejectFunction = () =>
        PublicFormAuthService.createRedirectURL(MOCK_FORM_ID)

      // Assert
      await expect(rejectFunction).rejects.toThrowError(error)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${PublicFormAuthService.PUBLIC_FORMS_ENDPOINT}/${MOCK_FORM_ID}/auth/redirect`,
        {
          params: { isPersistentLogin: false },
        },
      )
    })
  })

  describe('validateESrvcId', () => {
    it('should return isValid as true when the e-service ID is valid', async () => {
      const mockData = { isValid: true }
      MockAxios.get.mockResolvedValueOnce({ data: mockData })

      const result = await PublicFormAuthService.validateEsrvcId(MOCK_FORM_ID)

      expect(MockAxios.get).toHaveBeenCalledWith(
        `${PublicFormAuthService.PUBLIC_FORMS_ENDPOINT}/${MOCK_FORM_ID}/auth/validate`,
      )
      expect(result).toEqual(mockData)
    })

    it('should return isValid as false and an errorcode when the e-service ID is invalid', async () => {
      const mockData = { isValid: false, errorCode: '123' }
      MockAxios.get.mockResolvedValueOnce({ data: mockData })

      const result = await PublicFormAuthService.validateEsrvcId(MOCK_FORM_ID)

      expect(MockAxios.get).toHaveBeenCalledWith(
        `${PublicFormAuthService.PUBLIC_FORMS_ENDPOINT}/${MOCK_FORM_ID}/auth/validate`,
      )
      expect(result).toEqual(mockData)
    })

    it('should reject with error when API call fails', async () => {
      const error = new Error('rejected')
      MockAxios.get.mockRejectedValueOnce(error)

      const rejectFunction = () =>
        PublicFormAuthService.validateEsrvcId(MOCK_FORM_ID)

      await expect(rejectFunction).rejects.toThrowError(error)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${PublicFormAuthService.PUBLIC_FORMS_ENDPOINT}/${MOCK_FORM_ID}/auth/validate`,
      )
    })
  })
})
