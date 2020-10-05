import mongoose from 'mongoose'
import { ImportMock } from 'ts-mock-imports'

import getFormModel from 'src/app/models/form.server.model'
import getSmsCountModel from 'src/app/models/sms_count.server.model'
import * as SmsService from 'src/app/services/sms.service'
import { VfnErrors } from 'src/shared/util/verification'
import {
  FormOtpData,
  IFormSchema,
  LogType,
  ResponseMode,
  SmsType,
} from 'src/types'

import dbHandler from '../helpers/jest-db'

const Form = getFormModel(mongoose)
const SmsCount = getSmsCountModel(mongoose)

// Test numbers provided by Twilio:
// https://www.twilio.com/docs/iam/test-credentials
const TWILIO_TEST_NUMBER = '+15005550006'

const MOCK_MSG_SRVC_SID = 'mockMsgSrvcSid'

describe('sms.service', () => {
  const MOCK_VALID_CONFIG = ({
    msgSrvcSid: MOCK_MSG_SRVC_SID,
    client: {
      messages: {
        create: jest.fn().mockResolvedValue({
          status: 'testStatus',
          sid: 'testSid',
        }),
      },
    },
  } as unknown) as Parameters<typeof SmsService.sendVerificationOtp>[3]

  const MOCK_INVALID_CONFIG = ({
    msgSrvcSid: MOCK_MSG_SRVC_SID,
    client: {
      messages: {
        create: jest.fn().mockResolvedValue({
          status: 'testStatus',
          sid: undefined,
          errorCode: 21211,
        }),
      },
    },
  } as unknown) as Parameters<typeof SmsService.sendVerificationOtp>[3]

  const smsCountSpy = jest.spyOn(SmsCount, 'logSms')

  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => {
    await dbHandler.clearDatabase()
    ImportMock.restore()
    smsCountSpy.mockClear()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('sendVerificationOtp', () => {
    let testForm: IFormSchema
    let mockOtpData: FormOtpData

    beforeEach(async () => {
      const { user } = await dbHandler.insertFormCollectionReqs()
      testForm = await Form.create({
        title: 'Test Form',
        emails: ['test@test.gov.sg'],
        admin: user._id,
        responseMode: ResponseMode.Email,
      })

      mockOtpData = {
        form: testForm._id,
        formAdmin: {
          email: user.email,
          userId: user._id,
        },
      }
    })

    it('should throw error if otpData is null', async () => {
      // Arrange
      // Return null on Form method
      ImportMock.mockFunction(Form, 'getOtpData', null)

      // Act
      const pendingPromise = SmsService.sendVerificationOtp(
        /* recipient= */ TWILIO_TEST_NUMBER,
        /* otp= */ '111111',
        /* formId= */ testForm._id,
        /* defaultConfig= */ MOCK_VALID_CONFIG,
      )

      // Assert
      await expect(pendingPromise).rejects.toThrowError(
        `Unable to retrieve otpData from ${testForm._id}`,
      )
    })

    it('should log and send verification OTP if twilio has no errors', async () => {
      // Arrange
      ImportMock.mockFunction(Form, 'getOtpData', mockOtpData)

      // Act
      const pendingPromise = SmsService.sendVerificationOtp(
        /* recipient= */ TWILIO_TEST_NUMBER,
        /* otp= */ '111111',
        /* formId= */ testForm._id,
        /* defaultConfig= */ MOCK_VALID_CONFIG,
      )

      // Assert
      await expect(pendingPromise).resolves.toEqual(true)
      // Logging should also have happened.
      const expectedLogParams = {
        otpData: mockOtpData,
        msgSrvcSid: MOCK_MSG_SRVC_SID,
        smsType: SmsType.verification,
        logType: LogType.success,
      }
      expect(smsCountSpy).toHaveBeenCalledTimes(1)
      expect(smsCountSpy).toHaveBeenCalledWith(expectedLogParams)
    })

    it('should log failure and throw error if twilio failed to send', async () => {
      // Arrange
      ImportMock.mockFunction(Form, 'getOtpData', mockOtpData)

      const expectedError = new Error(VfnErrors.InvalidMobileNumber)
      expectedError.name = VfnErrors.SendOtpFailed

      // Act
      const pendingPromise = SmsService.sendVerificationOtp(
        /* recipient= */ TWILIO_TEST_NUMBER,
        /* otp= */ '111111',
        /* formId= */ testForm._id,
        /* defaultConfig= */ MOCK_INVALID_CONFIG,
      )

      // Assert
      await expect(pendingPromise).rejects.toThrowError(expectedError)
      // Logging should also have happened.
      const expectedLogParams = {
        otpData: mockOtpData,
        msgSrvcSid: MOCK_MSG_SRVC_SID,
        smsType: SmsType.verification,
        logType: LogType.failure,
      }
      expect(smsCountSpy).toHaveBeenCalledTimes(1)
      expect(smsCountSpy).toHaveBeenCalledWith(expectedLogParams)
    })
  })

  describe('sendAdminContactOtp', () => {
    const MOCK_USER_ID = 'mock user id'
    const MOCK_OTP_DATA = {
      admin: MOCK_USER_ID,
    }
    it('should log and send contact otp successfully when no errors occurs', async () => {
      // Act
      const actualResult = await SmsService.sendAdminContactOtp(
        /* recipient= */ TWILIO_TEST_NUMBER,
        /* otp= */ '111111',
        /* userId= */ MOCK_USER_ID,
        /* defaultConfig= */ MOCK_VALID_CONFIG,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Logging should also have happened.
      const expectedLogParams = {
        msgSrvcSid: MOCK_MSG_SRVC_SID,
        otpData: MOCK_OTP_DATA,
        smsType: SmsType.adminContact,
        logType: LogType.success,
      }
      expect(smsCountSpy).toHaveBeenCalledTimes(1)
      expect(smsCountSpy).toHaveBeenCalledWith(expectedLogParams)
    })

    it('should log failure and return error when twilio fails to send', async () => {
      // Act
      const actualResult = await SmsService.sendAdminContactOtp(
        /* recipient= */ TWILIO_TEST_NUMBER,
        /* otp= */ '111111',
        /* userId= */ MOCK_USER_ID,
        /* defaultConfig= */ MOCK_INVALID_CONFIG,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        SmsService.SmsSendError,
      )
      // Logging should also have happened.
      const expectedLogParams = {
        msgSrvcSid: MOCK_MSG_SRVC_SID,
        otpData: MOCK_OTP_DATA,
        smsType: SmsType.adminContact,
        logType: LogType.failure,
      }
      expect(smsCountSpy).toHaveBeenCalledTimes(1)
      expect(smsCountSpy).toHaveBeenCalledWith(expectedLogParams)
    })
  })
})
