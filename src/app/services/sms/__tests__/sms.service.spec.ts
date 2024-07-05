import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import mongoose from 'mongoose'

import getFormModel from 'src/app/models/form.server.model'
import {
  DatabaseError,
  MalformedParametersError,
} from 'src/app/modules/core/core.errors'
import { getMongoErrorMessage } from 'src/app/utils/handle-mongo-error'
import { FormOtpData, IFormSchema, IUserSchema } from 'src/types'

import { FormResponseMode } from '../../../../../shared/types'
import { InvalidNumberError } from '../../postman-sms/postman-sms.errors'
import * as SmsService from '../sms.service'
import { LogType, SmsType, TwilioConfig } from '../sms.types'
import getSmsCountModel from '../sms_count.server.model'

const FormModel = getFormModel(mongoose)
const SmsCountModel = getSmsCountModel(mongoose)

// Test numbers provided by Twilio:
// https://www.twilio.com/docs/iam/test-credentials
const TWILIO_TEST_NUMBER = '+15005550006'
const MOCK_MSG_SRVC_SID = 'mockMsgSrvcSid'
const MOCK_SENDER_IP = '200.000.000.000'

const twilioSuccessSpy = jest.fn().mockResolvedValue({
  status: 'testStatus',
  sid: 'testSid',
})

const MOCK_VALID_CONFIG = {
  msgSrvcSid: MOCK_MSG_SRVC_SID,
  client: {
    messages: {
      create: twilioSuccessSpy,
    },
  },
} as unknown as TwilioConfig

const twilioFailureSpy = jest.fn().mockResolvedValue({
  status: 'testStatus',
  sid: undefined,
  errorCode: 21211,
})

const MOCK_INVALID_CONFIG = {
  msgSrvcSid: MOCK_MSG_SRVC_SID,
  client: {
    messages: {
      create: twilioFailureSpy,
    },
  },
} as unknown as TwilioConfig

const smsCountSpy = jest.spyOn(SmsCountModel, 'logSms')

describe('sms.service', () => {
  let testUser: IUserSchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    const { user } = await dbHandler.insertFormCollectionReqs()
    testUser = user
    jest.clearAllMocks()
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
        responseMode: FormResponseMode.Email,
      })

      mockOtpData = {
        form: testForm._id,
        formAdmin: {
          email: testUser.email,
          userId: testUser._id,
        },
      }
    })

    it('should return MalformedParametersError error when retrieved otpData is null', async () => {
      // Arrange
      // Return null on Form method
      jest.spyOn(FormModel, 'getOtpData').mockResolvedValueOnce(null)

      // Act
      const actualResult = await SmsService.sendVerificationOtp(
        /* recipient= */ TWILIO_TEST_NUMBER,
        /* otp= */ '111111',
        /* otpPrefix= */ 'ABC',
        /* formId= */ testForm._id,
        /* senderIp= */ MOCK_SENDER_IP,
        /* defaultConfig= */ MOCK_VALID_CONFIG,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MalformedParametersError(
          `Unable to retrieve otpData from ${testForm._id}`,
        ),
      )
    })

    it('should log and send verification OTP when sending has no errors', async () => {
      // Arrange
      jest.spyOn(FormModel, 'getOtpData').mockResolvedValueOnce(mockOtpData)

      // Act
      const actualResult = await SmsService.sendVerificationOtp(
        /* recipient= */ TWILIO_TEST_NUMBER,
        /* otp= */ '111111',
        /* otpPrefix= */ 'ABC',
        /* formId= */ testForm._id,
        /* senderIp= */ MOCK_SENDER_IP,
        /* defaultConfig= */ MOCK_VALID_CONFIG,
      )

      // Assert
      expect(twilioSuccessSpy.mock.calls[0][0].statusCallback).toEqual(
        expect.stringContaining('?senderIp'),
      )

      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Logging should also have happened.
      const expectedLogParams = {
        smsData: mockOtpData,
        msgSrvcSid: MOCK_MSG_SRVC_SID,
        smsType: SmsType.Verification,
        logType: LogType.success,
      }
      expect(smsCountSpy).toHaveBeenCalledWith(expectedLogParams)
    })

    it('should log failure and return InvalidNumberError when verification OTP fails to send due to invalid number', async () => {
      // Arrange
      jest.spyOn(FormModel, 'getOtpData').mockResolvedValueOnce(mockOtpData)

      // Act
      const actualResult = await SmsService.sendVerificationOtp(
        /* recipient= */ TWILIO_TEST_NUMBER,
        /* otp= */ '111111',
        /* otpPrefix= */ 'ABC',
        /* formId= */ testForm._id,
        /* senderIp= */ MOCK_SENDER_IP,
        /* defaultConfig= */ MOCK_INVALID_CONFIG,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(new InvalidNumberError())
      // Logging should also have happened.
      const expectedLogParams = {
        smsData: mockOtpData,
        msgSrvcSid: MOCK_MSG_SRVC_SID,
        smsType: SmsType.Verification,
        logType: LogType.failure,
      }
      expect(smsCountSpy).toHaveBeenCalledWith(expectedLogParams)
    })
  })

  describe('retrieveFreeSmsCounts', () => {
    const VERIFICATION_SMS_COUNT = 3

    it('should retrieve sms counts correctly for a specified user', async () => {
      // Arrange
      const retrieveSpy = jest.spyOn(SmsCountModel, 'retrieveFreeSmsCounts')
      retrieveSpy.mockResolvedValueOnce(VERIFICATION_SMS_COUNT)

      // Act
      const actual = await SmsService.retrieveFreeSmsCounts(testUser._id)

      // Assert
      expect(actual._unsafeUnwrap()).toBe(VERIFICATION_SMS_COUNT)
    })

    it('should return a database error when retrieval fails', async () => {
      // Arrange
      const retrieveSpy = jest.spyOn(SmsCountModel, 'retrieveFreeSmsCounts')
      retrieveSpy.mockRejectedValueOnce('ohno')

      // Act
      const actual = await SmsService.retrieveFreeSmsCounts(testUser._id)

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(
        new DatabaseError(getMongoErrorMessage('ohno')),
      )
    })
  })
})
