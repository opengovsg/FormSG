import axios from 'axios'
import { ObjectId } from 'bson'
import { mocked } from 'ts-jest/utils'

import * as MyInfoService from '../MyInfoService'

jest.mock('axios')
const MockAxios = mocked(axios, true)

const MOCK_REDIRECT_URL = 'redirectURL'
const MOCK_FORM_ID = new ObjectId().toHexString()

describe('MyInfoService', () => {
  afterEach(() => jest.resetAllMocks())
  describe('createRedirectURL', () => {
    it('should return the redirect URL when retrieval succeeds', async () => {
      const mockData = { redirectURL: MOCK_REDIRECT_URL }
      MockAxios.get.mockResolvedValueOnce({ data: mockData })

      const result = await MyInfoService.createRedirectURL(MOCK_FORM_ID)

      expect(MockAxios.get).toHaveBeenCalledWith(
        MyInfoService.REDIRECT_URL_ENDPOINT,
        {
          params: { formId: MOCK_FORM_ID },
        },
      )
      expect(result).toEqual(mockData)
    })

    it('should reject with error when API call fails', async () => {
      const error = new Error('rejected')
      MockAxios.get.mockRejectedValueOnce(error)

      const rejectFunction = () => MyInfoService.createRedirectURL(MOCK_FORM_ID)

      await expect(rejectFunction).rejects.toThrowError(error)
      expect(MockAxios.get).toHaveBeenCalledWith(
        MyInfoService.REDIRECT_URL_ENDPOINT,
        {
          params: { formId: MOCK_FORM_ID },
        },
      )
    })
  })

  describe('validateESrvcId', () => {
    it('should return isValid as true when the e-service ID is valid', async () => {
      const mockData = { isValid: true }
      MockAxios.get.mockResolvedValueOnce({ data: mockData })

      const result = await MyInfoService.validateESrvcId(MOCK_FORM_ID)

      expect(MockAxios.get).toHaveBeenCalledWith(
        MyInfoService.VALIDATE_ESRVCID_ENDPOINT,
        {
          params: { formId: MOCK_FORM_ID },
        },
      )
      expect(result).toEqual(mockData)
    })

    it('should return isValid as false and an errorcode when the e-service ID is invalid', async () => {
      const mockData = { isValid: false, errorCode: '123' }
      MockAxios.get.mockResolvedValueOnce({ data: mockData })

      const result = await MyInfoService.validateESrvcId(MOCK_FORM_ID)

      expect(MockAxios.get).toHaveBeenCalledWith(
        MyInfoService.VALIDATE_ESRVCID_ENDPOINT,
        {
          params: { formId: MOCK_FORM_ID },
        },
      )
      expect(result).toEqual(mockData)
    })

    it('should reject with error when API call fails', async () => {
      const error = new Error('rejected')
      MockAxios.get.mockRejectedValueOnce(error)

      const rejectFunction = () => MyInfoService.validateESrvcId(MOCK_FORM_ID)

      await expect(rejectFunction).rejects.toThrowError(error)
      expect(MockAxios.get).toHaveBeenCalledWith(
        MyInfoService.VALIDATE_ESRVCID_ENDPOINT,
        {
          params: { formId: MOCK_FORM_ID },
        },
      )
    })
  })
})
