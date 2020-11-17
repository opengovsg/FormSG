import { errAsync, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import { DatabaseError } from 'src/app/modules/core/core.errors'
import { MissingUserError } from 'src/app/modules/user/user.errors'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { handleListDashboardForms } from '../admin-form.controller'
import * as AdminFormService from '../admin-form.service'

jest.mock('../admin-form.service')
const MockAdminFormService = mocked(AdminFormService)

describe('admin-form.controller', () => {
  describe('handleListDashboardForms', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      session: {
        user: {
          _id: 'exists',
        },
      },
    })
    it('should return 200 with list of forms', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock return array.
      MockAdminFormService.getDashboardForms.mockReturnValueOnce(okAsync([]))

      // Act
      await handleListDashboardForms(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith([])
    })

    it('should return 422 on MissingUserError', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      MockAdminFormService.getDashboardForms.mockReturnValueOnce(
        errAsync(new MissingUserError()),
      )

      // Act
      await handleListDashboardForms(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(422)
      expect(mockRes.json).toBeCalledWith({ message: 'User not found' })
    })

    it('should return 500 when database error occurs', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const mockErrorString = 'something went wrong'
      MockAdminFormService.getDashboardForms.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )

      // Act
      await handleListDashboardForms(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.json).toBeCalledWith({ message: mockErrorString })
    })
  })
})
