/* eslint-disable @typescript-eslint/ban-ts-comment */
import axios from 'axios'
import { ObjectId } from 'bson-ext'
import { mocked } from 'ts-jest/utils'

import * as SmsService from '../SmsService'

jest.mock('axios')
const MockAxios = mocked(axios, true)

describe('SmsService', () => {
  describe('getSmsVerificationStateForFormAdmin', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    it('should call the endpoint successfully when parameters are provided', async () => {
      // Arrange
      MockAxios.get.mockResolvedValueOnce({ data: 'some data' })
      // Act
      const actual = await SmsService.getSmsVerificationStateForFormAdmin(
        MOCK_FORM_ID,
      )

      // Assert
      expect(MockAxios.get).toBeCalledWith(
        `${SmsService.FORM_API_PREFIX}/${SmsService.SMS_ENDPOINT}/${MOCK_FORM_ID}`,
      )
      expect(actual).toBe('some data')
    })
  })
})
