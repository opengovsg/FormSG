import mongoose from 'mongoose'

import getFormModel from 'src/app/models/form.server.model'
import { VfnErrors } from 'src/shared/util/verification'
import { FormOtpData, IFormSchema, IUserSchema, ResponseMode } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import getSmsCountModel from '../sms_count.server.model'
import * as SmsService from '../sms.service'
import { LogType, SmsType, TwilioConfig } from '../sms.types'

const FormModel = getFormModel(mongoose)
const SmsCountModel = getSmsCountModel(mongoose)

// Test numbers provided by Twilio:
// https://www.twilio.com/docs/iam/test-credentials
const TWILIO_TEST_NUMBER = '+15005550006'

const MOCK_MSG_SRVC_SID = 'mockMsgSrvcSid'

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
} as unknown) as TwilioConfig

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
} as unknown) as TwilioConfig

const smsCountSpy = jest.spyOn(SmsCountModel, 'logSms')

describe('sms.service', () => {
  let testUser: IUserSchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    const { user } = await dbHandler.insertFormCollectionReqs()
    testUser = user
    smsCountSpy.mockClear()
  })
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('sendVerificationOtp', () => {
    let mockOtpData: FormOtpData
    let testForm: IFormSchema

    beforeEach(async () => {
      testForm = await FormModel.create({
        title: 'Test Form',
        emails: [testUser.email],
        admin: testUser._id,
        responseMode: ResponseMode.Email,
      })

      mockOtpData = {
        form: testForm._id,
        formAdmin: {
          email: testUser.email,
          userId: testUser._id,
        },
      }
    })

    it('should throw error when retrieved otpData is null', async () => {
      // Arrange
      // Return null on Form method
      jest.spyOn(FormModel, 'getOtpData').mockResolvedValueOnce(null)

      // Act
      const actualPromise = SmsService.sendVerificationOtp(
        /* recipient= */ TWILIO_TEST_NUMBER,
        /* otp= */ '111111',
        /* formId= */ testForm._id,
        /* defaultConfig= */ MOCK_VALID_CONFIG,
      )

      await expect(actualPromise).rejects.toThrowError()
    })

    it('should log and send verification OTP when sending has no errors', async () => {
      // Arrange
      jest.spyOn(FormModel, 'getOtpData').mockResolvedValueOnce(mockOtpData)

      // Act
      const actualPromise = SmsService.sendVerificationOtp(
        /* recipient= */ TWILIO_TEST_NUMBER,
        /* otp= */ '111111',
        /* formId= */ testForm._id,
        /* defaultConfig= */ MOCK_VALID_CONFIG,
      )

      // Assert
      // Should resolve to true
      await expect(actualPromise).resolves.toEqual(true)
      // Logging should also have happened.
      const expectedLogParams = {
        otpData: mockOtpData,
        msgSrvcSid: MOCK_MSG_SRVC_SID,
        smsType: SmsType.verification,
        logType: LogType.success,
      }
      expect(smsCountSpy).toHaveBeenCalledWith(expectedLogParams)
    })

    it('should log failure and throw error when verification OTP fails to send', async () => {
      // Arrange
      jest.spyOn(FormModel, 'getOtpData').mockResolvedValueOnce(mockOtpData)

      // Act
      const actualPromise = SmsService.sendVerificationOtp(
        /* recipient= */ TWILIO_TEST_NUMBER,
        /* otp= */ '111111',
        /* formId= */ testForm._id,
        /* defaultConfig= */ MOCK_INVALID_CONFIG,
      )

      // Assert
      const expectedError = new Error(VfnErrors.InvalidMobileNumber)
      expectedError.name = VfnErrors.SendOtpFailed

      await expect(actualPromise).rejects.toThrow(expectedError)
      // Logging should also have happened.
      const expectedLogParams = {
        otpData: mockOtpData,
        msgSrvcSid: MOCK_MSG_SRVC_SID,
        smsType: SmsType.verification,
        logType: LogType.failure,
      }
      expect(smsCountSpy).toHaveBeenCalledWith(expectedLogParams)
    })
  })

  describe('sendAdminContactOtp', () => {
    it('should log and send contact OTP when sending has no errors', async () => {
      // Act
      const actualResult = await SmsService.sendAdminContactOtp(
        /* recipient= */ TWILIO_TEST_NUMBER,
        /* otp= */ '111111',
        /* userId= */ testUser._id,
        /* defaultConfig= */ MOCK_VALID_CONFIG,
      )

      // Assert
      // Should resolve to true
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Logging should also have happened.
      const expectedLogParams = {
        otpData: {
          admin: testUser._id,
        },
        msgSrvcSid: MOCK_MSG_SRVC_SID,
        smsType: SmsType.adminContact,
        logType: LogType.success,
      }
      expect(smsCountSpy).toHaveBeenCalledWith(expectedLogParams)
    })
  })

  it('should log failure and throw error when contact OTP fails to send', async () => {
    // Act
    const actualResult = await SmsService.sendAdminContactOtp(
      /* recipient= */ TWILIO_TEST_NUMBER,
      /* otp= */ '111111',
      /* userId= */ testUser._id,
      /* defaultConfig= */ MOCK_INVALID_CONFIG,
    )

    // Assert
    const expectedError = new Error(VfnErrors.InvalidMobileNumber)
    expectedError.name = VfnErrors.SendOtpFailed

    expect(actualResult.isErr()).toEqual(true)

    // Logging should also have happened.
    const expectedLogParams = {
      otpData: {
        admin: testUser._id,
      },
      msgSrvcSid: MOCK_MSG_SRVC_SID,
      smsType: SmsType.adminContact,
      logType: LogType.failure,
    }
    expect(smsCountSpy).toHaveBeenCalledWith(expectedLogParams)
  })
})
