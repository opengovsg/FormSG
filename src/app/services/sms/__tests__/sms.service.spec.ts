import { ObjectId } from 'bson'
import mongoose from 'mongoose'

import getFormModel from 'src/app/models/form.server.model'
import {
  DatabaseError,
  MalformedParametersError,
} from 'src/app/modules/core/core.errors'
import { getMongoErrorMessage } from 'src/app/utils/handle-mongo-error'
import { FormOtpData, IFormSchema, IUserSchema } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { FormResponseMode } from '../../../../../shared/types'
import { VfnErrors } from '../../../../../shared/utils/verification'
import { InvalidNumberError } from '../sms.errors'
import * as SmsService from '../sms.service'
import { LogType, SmsType, TwilioConfig } from '../sms.types'
import {
  renderBouncedSubmissionSms,
  renderFormDeactivatedSms,
} from '../sms.util'
import getSmsCountModel from '../sms_count.server.model'

const FormModel = getFormModel(mongoose)
const SmsCountModel = getSmsCountModel(mongoose)

// Test numbers provided by Twilio:
// https://www.twilio.com/docs/iam/test-credentials
const TWILIO_TEST_NUMBER = '+15005550006'
const MOCK_MSG_SRVC_SID = 'mockMsgSrvcSid'
const MOCK_RECIPIENT_EMAIL = 'recipientEmail@email.com'
const MOCK_ADMIN_EMAIL = 'adminEmail@email.com'
const MOCK_ADMIN_ID = new ObjectId().toHexString()
const MOCK_FORM_ID = new ObjectId().toHexString()
const MOCK_FORM_TITLE = 'formTitle'
const MOCK_SENDER_IP = '200.000.000.000'

const MOCK_TWILIO_WEBHOOK_ROUTE = '/api/v3/notifications/twilio'

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

  describe('sendFormDeactivatedSms', () => {
    it('should send SMS and log success when sending is successful', async () => {
      const expectedMessage = renderFormDeactivatedSms(MOCK_FORM_TITLE)

      await SmsService.sendFormDeactivatedSms(
        {
          recipient: TWILIO_TEST_NUMBER,
          adminEmail: MOCK_ADMIN_EMAIL,
          adminId: MOCK_ADMIN_ID,
          formId: MOCK_FORM_ID,
          formTitle: MOCK_FORM_TITLE,
          recipientEmail: MOCK_RECIPIENT_EMAIL,
        },
        MOCK_VALID_CONFIG,
      )

      expect(twilioSuccessSpy).toHaveBeenCalledWith({
        to: TWILIO_TEST_NUMBER,
        body: expectedMessage,
        from: MOCK_VALID_CONFIG.msgSrvcSid,
        forceDelivery: true,
        statusCallback: expect.stringContaining(MOCK_TWILIO_WEBHOOK_ROUTE),
      })

      expect(twilioSuccessSpy.mock.calls[0][0].statusCallback).toEqual(
        expect.not.stringContaining('?senderIp'),
      )

      expect(smsCountSpy).toHaveBeenCalledWith({
        smsData: {
          form: MOCK_FORM_ID,
          collaboratorEmail: MOCK_RECIPIENT_EMAIL,
          recipientNumber: TWILIO_TEST_NUMBER,
          formAdmin: {
            email: MOCK_ADMIN_EMAIL,
            userId: MOCK_ADMIN_ID,
          },
        },
        smsType: SmsType.DeactivatedForm,
        msgSrvcSid: MOCK_VALID_CONFIG.msgSrvcSid,
        logType: LogType.success,
      })
    })

    it('should log failure when sending fails', async () => {
      // Arrange
      const expectedMessage = renderFormDeactivatedSms(MOCK_FORM_TITLE)

      // Act
      const actualResult = await SmsService.sendFormDeactivatedSms(
        {
          recipient: TWILIO_TEST_NUMBER,
          adminEmail: MOCK_ADMIN_EMAIL,
          adminId: MOCK_ADMIN_ID,
          formId: MOCK_FORM_ID,
          formTitle: MOCK_FORM_TITLE,
          recipientEmail: MOCK_RECIPIENT_EMAIL,
        },
        MOCK_INVALID_CONFIG,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(new InvalidNumberError())
      expect(twilioFailureSpy).toHaveBeenCalledWith({
        to: TWILIO_TEST_NUMBER,
        body: expectedMessage,
        from: MOCK_INVALID_CONFIG.msgSrvcSid,
        forceDelivery: true,
        statusCallback: expect.stringContaining(MOCK_TWILIO_WEBHOOK_ROUTE),
      })
      expect(smsCountSpy).toHaveBeenCalledWith({
        smsData: {
          form: MOCK_FORM_ID,
          collaboratorEmail: MOCK_RECIPIENT_EMAIL,
          recipientNumber: TWILIO_TEST_NUMBER,
          formAdmin: {
            email: MOCK_ADMIN_EMAIL,
            userId: MOCK_ADMIN_ID,
          },
        },
        smsType: SmsType.DeactivatedForm,
        msgSrvcSid: MOCK_INVALID_CONFIG.msgSrvcSid,
        logType: LogType.failure,
      })
    })
  })

  describe('sendBouncedSubmissionSms', () => {
    it('should send SMS and log success when sending is successful', async () => {
      const expectedMessage = renderBouncedSubmissionSms(MOCK_FORM_TITLE)

      await SmsService.sendBouncedSubmissionSms(
        {
          recipient: TWILIO_TEST_NUMBER,
          adminEmail: MOCK_ADMIN_EMAIL,
          adminId: MOCK_ADMIN_ID,
          formId: MOCK_FORM_ID,
          formTitle: MOCK_FORM_TITLE,
          recipientEmail: MOCK_RECIPIENT_EMAIL,
        },
        MOCK_VALID_CONFIG,
      )

      expect(twilioSuccessSpy).toHaveBeenCalledWith({
        to: TWILIO_TEST_NUMBER,
        body: expectedMessage,
        from: MOCK_VALID_CONFIG.msgSrvcSid,
        forceDelivery: true,
        statusCallback: expect.stringContaining(MOCK_TWILIO_WEBHOOK_ROUTE),
      })

      expect(twilioSuccessSpy.mock.calls[0][0].statusCallback).toEqual(
        expect.not.stringContaining('?senderIp'),
      )

      expect(smsCountSpy).toHaveBeenCalledWith({
        smsData: {
          form: MOCK_FORM_ID,
          collaboratorEmail: MOCK_RECIPIENT_EMAIL,
          recipientNumber: TWILIO_TEST_NUMBER,
          formAdmin: {
            email: MOCK_ADMIN_EMAIL,
            userId: MOCK_ADMIN_ID,
          },
        },
        smsType: SmsType.BouncedSubmission,
        msgSrvcSid: MOCK_VALID_CONFIG.msgSrvcSid,
        logType: LogType.success,
      })
    })

    it('should log failure when sending fails', async () => {
      // Arrange
      const expectedMessage = renderBouncedSubmissionSms(MOCK_FORM_TITLE)

      // Act
      const actualResult = await SmsService.sendBouncedSubmissionSms(
        {
          recipient: TWILIO_TEST_NUMBER,
          adminEmail: MOCK_ADMIN_EMAIL,
          adminId: MOCK_ADMIN_ID,
          formId: MOCK_FORM_ID,
          formTitle: MOCK_FORM_TITLE,
          recipientEmail: MOCK_RECIPIENT_EMAIL,
        },
        MOCK_INVALID_CONFIG,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(new InvalidNumberError())
      expect(twilioFailureSpy).toHaveBeenCalledWith({
        to: TWILIO_TEST_NUMBER,
        body: expectedMessage,
        from: MOCK_INVALID_CONFIG.msgSrvcSid,
        forceDelivery: true,
        statusCallback: expect.stringContaining(MOCK_TWILIO_WEBHOOK_ROUTE),
      })
      expect(smsCountSpy).toHaveBeenCalledWith({
        smsData: {
          form: MOCK_FORM_ID,
          collaboratorEmail: MOCK_RECIPIENT_EMAIL,
          recipientNumber: TWILIO_TEST_NUMBER,
          formAdmin: {
            email: MOCK_ADMIN_EMAIL,
            userId: MOCK_ADMIN_ID,
          },
        },
        smsType: SmsType.BouncedSubmission,
        msgSrvcSid: MOCK_INVALID_CONFIG.msgSrvcSid,
        logType: LogType.failure,
      })
    })
  })

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

  describe('sendAdminContactOtp', () => {
    it('should log and send contact OTP when sending has no errors', async () => {
      // Act
      const actualResult = await SmsService.sendAdminContactOtp(
        /* recipient= */ TWILIO_TEST_NUMBER,
        /* otp= */ '111111',
        /* userId= */ testUser._id,
        /* senderIp= */ MOCK_SENDER_IP,
        /* defaultConfig= */ MOCK_VALID_CONFIG,
      )

      // Assert
      expect(twilioSuccessSpy.mock.calls[0][0].statusCallback).toEqual(
        expect.stringContaining('?senderIp'),
      )

      // Should resolve to true
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Logging should also have happened.
      const expectedLogParams = {
        smsData: {
          admin: testUser._id,
        },
        msgSrvcSid: MOCK_MSG_SRVC_SID,
        smsType: SmsType.AdminContact,
        logType: LogType.success,
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

  it('should log failure and throw error when contact OTP fails to send', async () => {
    // Act
    const actualResult = await SmsService.sendAdminContactOtp(
      /* recipient= */ TWILIO_TEST_NUMBER,
      /* otp= */ '111111',
      /* userId= */ testUser._id,
      /* senderIp= */ MOCK_SENDER_IP,
      /* defaultConfig= */ MOCK_INVALID_CONFIG,
    )

    // Assert
    const expectedError = new Error(VfnErrors.InvalidMobileNumber)
    expectedError.name = VfnErrors.SendOtpFailed

    expect(actualResult.isErr()).toEqual(true)

    // Logging should also have happened.
    const expectedLogParams = {
      smsData: {
        admin: testUser._id,
      },
      msgSrvcSid: MOCK_MSG_SRVC_SID,
      smsType: SmsType.AdminContact,
      logType: LogType.failure,
    }
    expect(smsCountSpy).toHaveBeenCalledWith(expectedLogParams)
  })
})
