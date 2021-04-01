import MockAxios from 'jest-mock-axios'

import * as BillingService from '../BillingService'

jest.mock('axios', () => MockAxios)

describe('BillingService', () => {
  describe('getBillingInfo', () => {
    const MOCK_DATA = {
      adminEmail: 'Big Mock',
      formName: 'Mock Form',
      total: 0,
      formId: 'Mock',
      authType: 'NIL',
    }
    const MOCK_PARAMS = { yr: '2020', mth: '12', esrvcId: 'mock' }
    it('should return the billing information when the GET request succeeds', async () => {
      // Arrange
      MockAxios.get.mockResolvedValueOnce({ data: MOCK_DATA })

      // Act
      const actual = await BillingService.getBillingInfo(MOCK_PARAMS)

      // Assert
      expect(MockAxios.get).toHaveBeenCalledWith(
        BillingService.BILLING_ENDPOINT,
        {
          params: MOCK_PARAMS,
        },
      )
      expect(actual).toEqual(MOCK_DATA)
    })

    it('should reject with the provided error message when the GET request fails', async () => {
      // Arrange
      const expected = new Error('Mock Error')
      const shouldReject = () => BillingService.getBillingInfo(MOCK_PARAMS)
      MockAxios.get.mockRejectedValueOnce(expected)

      // Act
      await expect(shouldReject).rejects.toEqual(expected)

      // Assert
      expect(MockAxios.get).toHaveBeenCalledWith(
        BillingService.BILLING_ENDPOINT,
        {
          params: MOCK_PARAMS,
        },
      )
    })
  })
})
