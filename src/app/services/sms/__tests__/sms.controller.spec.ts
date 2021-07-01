import { ObjectID, ObjectId } from 'bson-ext'
import _ from 'lodash'
import mongoose from 'mongoose'
import { errAsync } from 'neverthrow'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import dbHandler from '../../../../../tests/unit/backend/helpers/jest-db'
import { IFormSchema, IUserSchema } from '../../../../types'
import { DatabaseError } from '../../../modules/core/core.errors'
import * as FormService from '../../../modules/form/form.service'
import * as SmsService from '../../../services/sms/sms.service'
import * as SmsController from '../sms.controller'
import { ISmsCountSchema, LogType, SmsCountsMeta, SmsType } from '../sms.types'
import getSmsCountModel from '../sms_count.server.model'

describe('sms.controller', () => {
  let mockUser: IUserSchema
  let mockForm: IFormSchema
  const VERIFICATION_SMS_COUNT = 3

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('handleGetFreeSmsCountForFormAdmin', () => {
    it('should retrieve counts and msgSrvcId when the user and the form exist', async () => {
      // Arrange
      const MOCK_REQ = expressHandler.mockRequest({
        params: {
          formId: mockForm._id,
        },
        session: {
          user: {
            _id: 'exists',
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const expected: SmsCountsMeta = {
        msgSrvcSid: mockForm.msgSrvcName,
        freeSmsCount: VERIFICATION_SMS_COUNT,
      }

      // Act
      await SmsController.handleGetFreeSmsCountForFormAdmin(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toBeCalledWith(200)
      expect(mockRes.json).toBeCalledWith(expected)
    })

    it('should return 404 when the form is not found in the database', async () => {
      // Arrange
      const MOCK_REQ = expressHandler.mockRequest({
        params: {
          formId: new ObjectId().toHexString(),
        },
        session: {
          user: {
            _id: 'exists',
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const expected = {
        message:
          'Could not find the form requested. Please refresh and try again.',
      }

      // Act
      await SmsController.handleGetFreeSmsCountForFormAdmin(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toBeCalledWith(404)
      expect(mockRes.json).toBeCalledWith(expected)
    })

    it('should return 500 when a database error occurs during form retrieval', async () => {
      // Arrange
      const MOCK_REQ = expressHandler.mockRequest({
        params: {
          formId: mockForm._id,
        },
        session: {
          user: {
            _id: 'exists',
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const retrieveSpy = jest.spyOn(FormService, 'retrieveFormById')
      retrieveSpy.mockReturnValueOnce(errAsync(new DatabaseError()))
      const expected = {
        message: 'Sorry, something went wrong. Please try again.',
      }

      // Act
      await SmsController.handleGetFreeSmsCountForFormAdmin(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.json).toBeCalledWith(expected)
    })

    it('should return 500 when a database error occurs during count retrieval', async () => {
      // Arrange
      const MOCK_REQ = expressHandler.mockRequest({
        params: {
          formId: mockForm._id,
        },
        session: {
          user: {
            _id: 'exists',
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const retrieveSpy = jest.spyOn(SmsService, 'retrieveFreeSmsCounts')
      retrieveSpy.mockReturnValueOnce(errAsync(new DatabaseError()))
      const expected = {
        message: 'Sorry, something went wrong. Please try again.',
      }

      // Act
      await SmsController.handleGetFreeSmsCountForFormAdmin(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.json).toBeCalledWith(expected)
    })
  })

  const insertVerifiedSms = async ({
    formId,
    formAdmin,
    msgSrvcSid = 'MOCK MESSAGE SERVICE ID',
    logType = LogType.success,
  }: {
    formId: ObjectID
    formAdmin: { email: string; userId: ObjectID }
    msgSrvcSid?: string
    logType?: LogType
  }): Promise<ISmsCountSchema> => {
    const SmsModel = getSmsCountModel(mongoose)
    return SmsModel.create({
      smsType: SmsType.Verification,
      logType,
      msgSrvcSid,
      form: formId,
      formAdmin,
    })
  }
})
