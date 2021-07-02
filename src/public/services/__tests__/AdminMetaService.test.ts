/* eslint-disable @typescript-eslint/ban-ts-comment */
import axios from 'axios'
import { ObjectId } from 'bson-ext'
import { mocked } from 'ts-jest/utils'

import * as AdminMetaService from '../AdminMetaService'

jest.mock('axios')
const MockAxios = mocked(axios, true)

describe('AdminMetaService', () => {
  describe('getSmsVerificationStateForFormAdmin', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    it('should call the endpoint successfully when parameters are provided', async () => {
      // Arrange
      MockAxios.get.mockResolvedValueOnce({ data: 'some data' })
      // Act
      const actual = await AdminMetaService.getSmsVerificationStateForFormAdmin(
        MOCK_FORM_ID,
      )

      // Assert
      expect(MockAxios.get).toBeCalledWith(
        `${AdminMetaService.FORM_API_PREFIX}/${MOCK_FORM_ID}/verified-sms/count/free`,
      )
      expect(actual).toBe('some data')
    })
  })
})
