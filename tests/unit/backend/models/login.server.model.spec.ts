/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ObjectId } from 'bson-ext'
import { omit } from 'lodash'
import mongoose from 'mongoose'

import getLoginModel from 'src/app/models/login.server.model'
import { AuthType, ILogin } from 'src/types'

import dbHandler from '../helpers/jest-db'

const LoginModel = getLoginModel(mongoose)

describe('login.server.model', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Schema', () => {
    const DEFAULT_PARAMS: ILogin = {
      admin: new ObjectId(),
      agency: new ObjectId(),
      authType: AuthType.SP,
      esrvcId: 'mock-esrvc-id',
      form: new ObjectId(),
    }

    it('should create and save successfully', async () => {
      // Act
      const actual = await LoginModel.create(DEFAULT_PARAMS)

      // Assert
      expect(actual).toEqual(
        expect.objectContaining({
          ...DEFAULT_PARAMS,
          created: expect.any(Date),
        }),
      )
    })

    it('should throw validation error when admin param is missing', async () => {
      // Act
      const actualPromise = LoginModel.create({
        ...DEFAULT_PARAMS,
        admin: undefined,
      })

      // Assert
      await expect(actualPromise).rejects.toThrowError(
        mongoose.Error.ValidationError,
      )
    })

    it('should throw validation error when form param is missing', async () => {
      // Act
      const actualPromise = LoginModel.create({
        ...DEFAULT_PARAMS,
        form: undefined,
      })

      // Assert
      await expect(actualPromise).rejects.toThrowError(
        mongoose.Error.ValidationError,
      )
    })

    it('should throw validation error when agency param is missing', async () => {
      // Act
      const actualPromise = LoginModel.create({
        ...DEFAULT_PARAMS,
        agency: undefined,
      })

      // Assert
      await expect(actualPromise).rejects.toThrowError(
        mongoose.Error.ValidationError,
      )
    })

    it('should throw validation error when AuthType param is missing', async () => {
      // Act
      // @ts-ignore
      const actualPromise = LoginModel.create(omit(DEFAULT_PARAMS, 'authType'))

      // Assert
      await expect(actualPromise).rejects.toThrowError(
        mongoose.Error.ValidationError,
      )
    })

    it('should throw validation error when esrvcId param is missing', async () => {
      // Act
      // @ts-ignore
      const actualPromise = LoginModel.create(omit(DEFAULT_PARAMS, 'esrvcId'))

      // Assert
      await expect(actualPromise).rejects.toThrowError(
        mongoose.Error.ValidationError,
      )
    })

    it('should throw validation error when esrvcId param is invalid format', async () => {
      // Act
      const actualPromise = LoginModel.create({
        ...DEFAULT_PARAMS,
        esrvcId: 'id with spaces',
      })

      // Assert
      await expect(actualPromise).rejects.toThrowError(
        'e-service ID must be alphanumeric, dashes are allowed',
      )
    })
  })
})
