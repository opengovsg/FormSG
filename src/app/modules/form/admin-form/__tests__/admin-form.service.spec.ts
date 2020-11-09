import mongoose from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import getFormModel from 'src/app/models/form.server.model'
import { DatabaseError } from 'src/app/modules/core/core.errors'
import { MissingUserError } from 'src/app/modules/user/user.errors'
import * as UserService from 'src/app/modules/user/user.service'
import { DashboardFormView, IPopulatedUser, IUserSchema } from 'src/types'

import { getDashboardForms } from '../admin-form.service'

const FormModel = getFormModel(mongoose)

jest.mock('src/app/modules/user/user.service')
const MockUserService = mocked(UserService)

describe('admin-form.service', () => {
  describe('getDashboardForms', () => {
    it('should return list of forms user is authorized to view', async () => {
      // Arrange
      const mockUserId = 'mockUserId'
      const mockUser: Partial<IUserSchema> = {
        email: 'MOCK_EMAIL@example.com',
        _id: mockUserId,
      }
      const mockDashboardForms: DashboardFormView[] = [
        {
          admin: {} as IPopulatedUser,
          title: 'test form 1',
        },
        {
          admin: {} as IPopulatedUser,
          title: 'test form 2',
        },
      ]
      // Mock user admin success.
      MockUserService.findAdminById.mockReturnValueOnce(
        okAsync(mockUser as IUserSchema),
      )
      const getSpy = jest
        .spyOn(FormModel, 'getDashboardForms')
        .mockResolvedValueOnce(mockDashboardForms)

      // Act
      const actualResult = await getDashboardForms(mockUserId)

      // Assert
      expect(getSpy).toHaveBeenCalledWith(mockUserId, mockUser.email)
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(mockDashboardForms)
    })

    it('should return MissingUserError when user with userId does not exist', async () => {
      // Arrange
      const expectedError = new MissingUserError('not found')
      MockUserService.findAdminById.mockReturnValueOnce(errAsync(expectedError))

      // Act
      const actualResult = await getDashboardForms('any')

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      // Error should passthrough.
      expect(actualResult._unsafeUnwrapErr()).toEqual(expectedError)
    })

    it('should return DatabaseError when error occurs whilst querying the database', async () => {
      // Arrange
      const mockUserId = 'mockUserId'
      const mockUser: Partial<IUserSchema> = {
        email: 'MOCK_EMAIL@example.com',
        _id: mockUserId,
      }
      // Mock user admin success.
      MockUserService.findAdminById.mockReturnValueOnce(
        okAsync(mockUser as IUserSchema),
      )
      const getSpy = jest
        .spyOn(FormModel, 'getDashboardForms')
        .mockRejectedValueOnce(new Error('some error'))

      // Act
      const actualResult = await getDashboardForms(mockUserId)

      // Assert
      expect(getSpy).toHaveBeenCalledWith(mockUserId, mockUser.email)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(new DatabaseError())
    })
  })
})
