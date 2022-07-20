/* eslint-disable @typescript-eslint/ban-ts-comment */
import MockAxios from 'jest-mock-axios'
import { UiCookieValues } from 'shared/types'

import { adminChooseEnvironment } from '../AdminService'

jest.mock('axios', () => MockAxios)

describe('AdminService', () => {
  describe('adminChooseEnvironment', () => {
    const MOCK_UI = UiCookieValues.React
    const MOCK_RESPONSE = UiCookieValues.React

    it('should return environment name if GET request succeeds', async () => {
      // Act
      const actual = adminChooseEnvironment(MOCK_UI)

      // Assert
      await expect(actual).resolves.toEqual(MOCK_RESPONSE)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `/api/v3/admin/environment/${MOCK_UI}`,
      )
    })
  })
})
