/* eslint-disable @typescript-eslint/ban-ts-comment */
import MockAxios from 'jest-mock-axios'
import { UiCookieValues } from 'shared/types'

import { ADMIN_ENDPOINT, adminChooseEnvironment } from '../AdminService'

jest.mock('axios', () => MockAxios)

describe('AdminService', () => {
  describe('adminChooseEnvironment', () => {
    const MOCK_UI = UiCookieValues.React
    const MOCK_RESPONSE = UiCookieValues.React

    it('should call the api correctly', async () => {
      //Arrange
      MockAxios.get.mockResolvedValueOnce({ data: MOCK_RESPONSE })

      // Act
      const actual = await adminChooseEnvironment(MOCK_UI)

      // Assert
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_ENDPOINT}/environment/${MOCK_UI}`,
      )
      expect(actual).toEqual(MOCK_RESPONSE)
    })
  })
})
