/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ObjectId } from 'bson-ext'
import { omit } from 'lodash'
import moment from 'moment-timezone'
import mongoose from 'mongoose'

import getLoginModel from 'src/app/models/login.server.model'
import { AuthType, IFormSchema, ILogin, IUserSchema } from 'src/types'

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

  describe('Statics', () => {
    describe('aggregateLoginStats', () => {
      const VALID_ESRVC_ID = 'MOCK-ESRVC-ID'
      const CURR_MOMENT = moment()
      const CURR_DATE = CURR_MOMENT.toDate()
      const FUTURE_MOMENT = CURR_MOMENT.clone().add(2, 'years')
      const FUTURE_DATE = FUTURE_MOMENT.toDate()

      let mockLoginDocuments: ILogin[]
      let testUser: IUserSchema
      let testForm: IFormSchema

      beforeEach(async () => {
        const { form, agency, user } = await dbHandler.insertEmailForm()

        mockLoginDocuments = [
          {
            _id: new ObjectId(),
            form: form._id,
            admin: user._id,
            agency: agency._id,
            authType: AuthType.SP,
            esrvcId: VALID_ESRVC_ID,
            created: CURR_DATE,
          },
          {
            _id: new ObjectId(),
            form: form._id,
            admin: user._id,
            agency: agency._id,
            authType: AuthType.SP,
            esrvcId: VALID_ESRVC_ID,
            created: CURR_DATE,
          },
          {
            _id: new ObjectId(),
            form: form._id,
            admin: user._id,
            agency: agency._id,
            authType: AuthType.SP,
            esrvcId: VALID_ESRVC_ID,
            created: CURR_DATE,
          },
          {
            _id: new ObjectId(),
            form: form._id,
            admin: user._id,
            agency: agency._id,
            authType: AuthType.SP,
            esrvcId: VALID_ESRVC_ID,
            created: FUTURE_DATE,
          },
        ]

        await LoginModel.insertMany(mockLoginDocuments)
        testUser = user
        testForm = form
      })

      it('should return empty array when esrvcId has no logins', async () => {
        // Arrange
        const endDate = CURR_MOMENT.clone().add(1, 'month').toDate()

        // Act
        const result = await LoginModel.aggregateLoginStats(
          'empty-esrvcid',
          CURR_DATE,
          endDate,
        )

        // Assert
        expect(result).toEqual([])
      })

      it('should return stats when given dates corresponds to some login documents', async () => {
        // Arrange
        const endDate = CURR_MOMENT.clone().add(1, 'month').toDate()

        // Act
        const result = await LoginModel.aggregateLoginStats(
          VALID_ESRVC_ID,
          CURR_DATE,
          endDate,
        )

        // Assert
        // Do a manual filter of documents in given date range.
        const loginsInRange = mockLoginDocuments.filter(
          (doc) =>
            doc.created && doc.created >= CURR_DATE && doc.created <= endDate,
        )
        const expected = [
          {
            adminEmail: testUser.email,
            formId: testForm._id,
            authType: AuthType.SP,
            formName: testForm.title,
            total: loginsInRange.length,
          },
        ]
        expect(result).toEqual(expected)
      })

      it('should return empty array when given dates do not correspond to any login documents', async () => {
        // Arrange
        const startMoment = CURR_MOMENT.clone().add(1, 'year')
        const startDate = startMoment.toDate()
        const endDate = startMoment.clone().add(1, 'month').toDate()
        // Do a manual filter of documents in given date range.
        const loginsInRange = mockLoginDocuments.filter(
          (doc) =>
            doc.created && doc.created >= startDate && doc.created <= endDate,
        )
        expect(loginsInRange.length).toEqual(0)

        // Act
        const result = await LoginModel.aggregateLoginStats(
          VALID_ESRVC_ID,
          startDate,
          endDate,
        )

        // Assert
        expect(result).toEqual([])
      })
    })
  })
})
