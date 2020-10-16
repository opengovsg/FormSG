import mongoose from 'mongoose'

import getLoginModel from 'src/app/models/login.server.model'
import { AuthType, LoginStatistic } from 'src/types'

import { DatabaseError } from '../../core/core.errors'
import * as BillingService from '../billing.service'

const LoginModel = getLoginModel(mongoose)

describe('billing.service', () => {
  describe('getSpLoginStats', () => {
    it('should return result of aggregate query successfully', async () => {
      // Arrange
      const mockLoginStats: LoginStatistic[] = [
        {
          adminEmail: 'mockemail@example.com',
          authType: AuthType.CP,
          formId: 'mock form id',
          formName: 'some form name',
          total: 100,
        },
      ]
      jest
        .spyOn(LoginModel, 'aggregateLoginStats')
        .mockResolvedValueOnce(mockLoginStats)

      // Act
      // Parameters don't matter since it is being mocked.
      const actualResult = await BillingService.getSpLoginStats(
        'mockEsrvcId',
        new Date(),
        new Date(),
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(mockLoginStats)
    })

    it('should return DatabaseError when aggregate query fails', async () => {
      // Arrange
      jest
        .spyOn(LoginModel, 'aggregateLoginStats')
        .mockRejectedValueOnce(new Error('boom'))

      // Act
      // Parameters don't matter since it is being mocked.
      const actualResult = await BillingService.getSpLoginStats(
        'mockEsrvcId',
        new Date(),
        new Date(),
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabaseError('Failed to retrieve billing records'),
      )
    })
  })
})
