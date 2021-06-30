import { ObjectId } from 'bson-ext'
import _ from 'lodash'
import { errAsync } from 'neverthrow'

import { DatabaseError } from 'src/app/modules/core/core.errors'
import { IFormSchema, IUserSchema } from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import dbHandler from '../../../../../tests/unit/backend/helpers/jest-db'
import * as FormService from '../../../modules/form/form.service'
import * as SmsService from '../../../services/sms/sms.service'
import * as SmsController from '../sms.controller'
import { SmsCountsMeta } from '../sms.types'

describe('sms.controller', () => {
  let mockUser: IUserSchema
  let mockForm: IFormSchema
  const VERIFICATION_SMS_COUNT = 3

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await dbHandler.clearDatabase()
    await dbHandler.closeDatabase()
  })

  beforeAll(async () => {
    await dbHandler.connect()
    const { user: createdUser } = await dbHandler.insertFormCollectionReqs()
    mockUser = createdUser
    const { form: createdForm } = await dbHandler.insertEmailForm({
      formOptions: {
        hasCaptcha: false,
        admin: mockUser._id,
      },
      // Avoid default mail domain so that user emails in the database don't conflict
      mailDomain: 'test2.gov.sg',
    })

    mockForm = createdForm
    const mockAdminDetails = { userId: mockUser._id, email: mockUser.email }

    await Promise.all(
      _.range(VERIFICATION_SMS_COUNT).map(async () => {
        await Promise.all([
          dbHandler.insertVerifiedSms({
            formId: mockForm._id,
            formAdmin: mockAdminDetails,
          }),
          dbHandler.insertVerifiedSms({
            formId: mockForm._id,
            formAdmin: mockAdminDetails,
            isOnboarded: true,
          }),
        ])
      }),
    )
  })

  describe('_handleGetFreeSmsCountForFormAdmin', () => {
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
      await SmsController._handleGetFreeSmsCountForFormAdmin(
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
      await SmsController._handleGetFreeSmsCountForFormAdmin(
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
      await SmsController._handleGetFreeSmsCountForFormAdmin(
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
      await SmsController._handleGetFreeSmsCountForFormAdmin(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.json).toBeCalledWith(expected)
    })
  })
})
