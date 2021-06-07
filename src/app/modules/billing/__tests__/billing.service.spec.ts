import mongoose from 'mongoose'

import getLoginModel from 'src/app/models/login.server.model'
import { getMongoErrorMessage } from 'src/app/utils/handle-mongo-error'
import {
  AuthType,
  ILoginSchema,
  IPopulatedForm,
  LoginStatistic,
} from 'src/types'

import { DatabaseError } from '../../core/core.errors'
import { FormHasNoAuthError } from '../billing.errors'
import * as BillingService from '../billing.service'

const LoginModel = getLoginModel(mongoose)

describe('billing.service', () => {
  describe('recordLoginByForm', () => {
    beforeEach(() => jest.restoreAllMocks())
    it('should call LoginModel.addLoginFromForm with the given form', async () => {
      const mockForm = { authType: AuthType.SP } as unknown as IPopulatedForm
      const mockLogin = { esrvcId: 'esrvcId' } as unknown as ILoginSchema
      const addLoginSpy = jest
        .spyOn(LoginModel, 'addLoginFromForm')
        .mockResolvedValueOnce(mockLogin)
      const result = await BillingService.recordLoginByForm(mockForm)
      expect(addLoginSpy).toHaveBeenCalledWith(mockForm)
      expect(result._unsafeUnwrap()).toEqual(mockLogin)
    })

    it('should return FormHasNoAuthError when form has authType NIL', async () => {
      const mockForm = { authType: AuthType.NIL } as unknown as IPopulatedForm
      const mockLogin = { esrvcId: 'esrvcId' } as unknown as ILoginSchema
      const addLoginSpy = jest
        .spyOn(LoginModel, 'addLoginFromForm')
        .mockResolvedValueOnce(mockLogin)
      const result = await BillingService.recordLoginByForm(mockForm)
      expect(addLoginSpy).not.toHaveBeenCalled()
      expect(result._unsafeUnwrapErr()).toEqual(new FormHasNoAuthError())
    })

    it('should return DatabaseError when adding login fails', async () => {
      const mockForm = { authType: AuthType.SP } as unknown as IPopulatedForm
      const addLoginSpy = jest
        .spyOn(LoginModel, 'addLoginFromForm')
        .mockRejectedValueOnce('')
      const result = await BillingService.recordLoginByForm(mockForm)
      expect(addLoginSpy).toHaveBeenCalledWith(mockForm)
      expect(result._unsafeUnwrapErr()).toEqual(
        new DatabaseError(getMongoErrorMessage('')),
      )
    })
  })
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
