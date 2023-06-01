/* eslint-disable @typescript-eslint/ban-ts-comment */
import axios from 'axios'

import * as AdminMetaService from '../AdminMetaService'

jest.mock('axios')
const MockAxios = jest.mocked(axios)

describe('AdminMetaService', () => {
  describe('getFreeSmsCountsUsedByFormAdmin', () => {
    const MOCK_FORM_ID = 'mock-form-id'

    it('should call the endpoint successfully when parameters are provided', async () => {
      // Arrange
      MockAxios.get.mockResolvedValueOnce({ data: 'some data' })
      // Act
      const actual = await AdminMetaService.getFreeSmsCountsUsedByFormAdmin(
        MOCK_FORM_ID,
      )

      // Assert
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${AdminMetaService.FORM_API_PREFIX}/${MOCK_FORM_ID}/verified-sms/count/free`,
      )
      expect(actual).toBe('some data')
    })
  })
})
