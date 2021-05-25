/* eslint-disable @typescript-eslint/ban-ts-comment */
import axios from 'axios'
import { ObjectId } from 'bson'
import Cookies from 'js-cookie'
import { mocked } from 'ts-jest/utils'

import { AuthType } from 'src/types'

import * as PublicFormAuthService from '../PublicFormAuthService'

const { PublicFormAuthCookieName } = PublicFormAuthService

jest.mock('axios')
jest.mock('js-cookie')
const MockAxios = mocked(axios, true)
const MockCookies = mocked(Cookies, true)

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

  describe('validateEsrvcId', () => {
    it('should call validate endpoint successfully', async () => {
      const mockData = { isValid: true }
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

  describe('getStoredJwt', () => {
    it('should return stored jwt of AuthType.SP when available', () => {
      // Arrange
      const expectedJwt = 'some mock jwt'
      // @ts-ignore
      MockCookies.get.mockReturnValueOnce(expectedJwt)

      // Act
      const actual = PublicFormAuthService.getStoredJwt(AuthType.SP)

      // Assert
      expect(actual).toEqual(expectedJwt)
      expect(MockCookies.get).toHaveBeenCalledWith(PublicFormAuthCookieName.SP)
    })

    it('should return stored jwt of AuthType.CP when available', () => {
      // Arrange
      const expectedJwt = 'some mock jwt'
      // @ts-ignore
      MockCookies.get.mockReturnValueOnce(expectedJwt)

      // Act
      const actual = PublicFormAuthService.getStoredJwt(AuthType.CP)

      // Assert
      expect(actual).toEqual(expectedJwt)
      expect(MockCookies.get).toHaveBeenCalledWith(PublicFormAuthCookieName.CP)
    })

    it('should return null when jwt of valid authType cannot be found', () => {
      // Arrange
      // Mock no cookie retrieved.
      // @ts-ignore
      MockCookies.get.mockReturnValueOnce(undefined)

      // Act
      const actual = PublicFormAuthService.getStoredJwt(AuthType.SP)

      // Assert
      expect(actual).toEqual(null)
      expect(MockCookies.get).toHaveBeenCalledWith(PublicFormAuthCookieName.SP)
    })
  })
})
