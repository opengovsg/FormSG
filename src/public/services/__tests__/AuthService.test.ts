import axios from 'axios'
import { ObjectId } from 'bson'
import { mocked } from 'ts-jest/utils'

import * as AuthService from '../AuthService'

jest.mock('axios')
const MockAxios = mocked(axios, true)

const MOCK_REDIRECT_URL = 'redirectURL'
const MOCK_FORM_ID = new ObjectId().toHexString()

describe('AuthService', () => {
  afterEach(() => jest.resetAllMocks())
  describe('createRedirectURL', () => {
    it('should return the redirect URL when retrieval succeeds and persistent login is not set', async () => {
      const mockData = { redirectURL: MOCK_REDIRECT_URL }
      MockAxios.get.mockResolvedValueOnce({ data: mockData })

      const result = await AuthService.createRedirectURL(MOCK_FORM_ID, false)

      expect(MockAxios.get).toHaveBeenCalledWith(
        `${AuthService.PUBLIC_FORMS_ENDPOINT}/${MOCK_FORM_ID}/${AuthService.REDIRECT_URL_ENDPOINT}`,
        {
          params: { isPersistentLogin: false },
        },
      )
      expect(result).toEqual(mockData)
    })

    it('should return the redirect URL when retrieval succeeds and persistent login is set', async () => {
      const mockData = { redirectURL: MOCK_REDIRECT_URL }
      MockAxios.get.mockResolvedValueOnce({ data: mockData })

      const result = await AuthService.createRedirectURL(MOCK_FORM_ID, true)

      expect(MockAxios.get).toHaveBeenCalledWith(
        `${AuthService.PUBLIC_FORMS_ENDPOINT}/${MOCK_FORM_ID}/${AuthService.REDIRECT_URL_ENDPOINT}`,
        {
          params: { isPersistentLogin: true },
        },
      )
      expect(result).toEqual(mockData)
    })

    it('should reject with error when API call fails', async () => {
      const error = new Error('rejected')
      MockAxios.get.mockRejectedValueOnce(error)

      const rejectFunction = () => AuthService.createRedirectURL(MOCK_FORM_ID)

      await expect(rejectFunction).rejects.toThrowError(error)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${AuthService.PUBLIC_FORMS_ENDPOINT}/${MOCK_FORM_ID}/${AuthService.REDIRECT_URL_ENDPOINT}`,
        {
          params: { isPersistentLogin: false },
        },
      )
    })
  })
})
