import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import mongoose from 'mongoose'
import { okAsync } from 'neverthrow'

import getFormModel from 'src/app/models/form.server.model'
import { MalformedParametersError } from 'src/app/modules/core/core.errors'
import { FormOtpData, IFormSchema, IUserSchema } from 'src/types'

import { FormResponseMode } from '../../../../../shared/types'
import { InvalidNumberError } from '../postman-sms.errors'
import PostmanSmsService from '../postman-sms.service'

const FormModel = getFormModel(mongoose)

const TEST_NUMBER = '+15005550006'

const MOCK_SENDER_IP = '200.000.000.000'

describe('postman-sms.service', () => {
  let testUser: IUserSchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    const { user } = await dbHandler.insertFormCollectionReqs()
    testUser = user
    jest.clearAllMocks()
  })
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  //   describe('sendFormDeactivatedSms', () => {
  //     it('should send SMS and log success when sending is successful', async () => {
  //       const expectedMessage = renderFormDeactivatedSms(MOCK_FORM_TITLE)

  //       await PostmanSmsService.sendFormDeactivatedSms(
  //         {
  //           recipient: TWILIO_TEST_NUMBER,
  //           adminEmail: MOCK_ADMIN_EMAIL,
  //           adminId: MOCK_ADMIN_ID,
  //           formId: MOCK_FORM_ID,
  //           formTitle: MOCK_FORM_TITLE,
  //           recipientEmail: MOCK_RECIPIENT_EMAIL,
  //         },
  //         MOCK_VALID_CONFIG,
  //       )

  //       expect(twilioSuccessSpy).toHaveBeenCalledWith({
  //         to: TWILIO_TEST_NUMBER,
  //         body: expectedMessage,
  //         from: MOCK_VALID_CONFIG.msgSrvcSid,
  //         forceDelivery: true,
  //         statusCallback: expect.stringContaining(MOCK_TWILIO_WEBHOOK_ROUTE),
  //       })

  //       expect(twilioSuccessSpy.mock.calls[0][0].statusCallback).toEqual(
  //         expect.not.stringContaining('?senderIp'),
  //       )

  //       expect(smsCountSpy).toHaveBeenCalledWith({
  //         smsData: {
  //           form: MOCK_FORM_ID,
  //           collaboratorEmail: MOCK_RECIPIENT_EMAIL,
  //           recipientNumber: TWILIO_TEST_NUMBER,
  //           formAdmin: {
  //             email: MOCK_ADMIN_EMAIL,
  //             userId: MOCK_ADMIN_ID,
  //           },
  //         },
  //         smsType: SmsType.DeactivatedForm,
  //         msgSrvcSid: MOCK_VALID_CONFIG.msgSrvcSid,
  //         logType: LogType.success,
  //       })
  //     })

  //     it('should log failure when sending fails', async () => {
  //       // Arrange
  //       const expectedMessage = renderFormDeactivatedSms(MOCK_FORM_TITLE)

  //       // Act
  //       const actualResult = await SmsService.sendFormDeactivatedSms(
  //         {
  //           recipient: TWILIO_TEST_NUMBER,
  //           adminEmail: MOCK_ADMIN_EMAIL,
  //           adminId: MOCK_ADMIN_ID,
  //           formId: MOCK_FORM_ID,
  //           formTitle: MOCK_FORM_TITLE,
  //           recipientEmail: MOCK_RECIPIENT_EMAIL,
  //         },
  //         MOCK_INVALID_CONFIG,
  //       )

  //       // Assert
  //       expect(actualResult._unsafeUnwrapErr()).toEqual(new InvalidNumberError())
  //       expect(twilioFailureSpy).toHaveBeenCalledWith({
  //         to: TWILIO_TEST_NUMBER,
  //         body: expectedMessage,
  //         from: MOCK_INVALID_CONFIG.msgSrvcSid,
  //         forceDelivery: true,
  //         statusCallback: expect.stringContaining(MOCK_TWILIO_WEBHOOK_ROUTE),
  //       })
  //       expect(smsCountSpy).toHaveBeenCalledWith({
  //         smsData: {
  //           form: MOCK_FORM_ID,
  //           collaboratorEmail: MOCK_RECIPIENT_EMAIL,
  //           recipientNumber: TWILIO_TEST_NUMBER,
  //           formAdmin: {
  //             email: MOCK_ADMIN_EMAIL,
  //             userId: MOCK_ADMIN_ID,
  //           },
  //         },
  //         smsType: SmsType.DeactivatedForm,
  //         msgSrvcSid: MOCK_INVALID_CONFIG.msgSrvcSid,
  //         logType: LogType.failure,
  //       })
  //     })
  //   })

  //   describe('sendBouncedSubmissionSms', () => {
  //     it('should send SMS and log success when sending is successful', async () => {
  //       const expectedMessage = renderBouncedSubmissionSms(MOCK_FORM_TITLE)

  //       await SmsService.sendBouncedSubmissionSms(
  //         {
  //           recipient: TWILIO_TEST_NUMBER,
  //           adminEmail: MOCK_ADMIN_EMAIL,
  //           adminId: MOCK_ADMIN_ID,
  //           formId: MOCK_FORM_ID,
  //           formTitle: MOCK_FORM_TITLE,
  //           recipientEmail: MOCK_RECIPIENT_EMAIL,
  //         },
  //         MOCK_VALID_CONFIG,
  //       )

  //       expect(twilioSuccessSpy).toHaveBeenCalledWith({
  //         to: TWILIO_TEST_NUMBER,
  //         body: expectedMessage,
  //         from: MOCK_VALID_CONFIG.msgSrvcSid,
  //         forceDelivery: true,
  //         statusCallback: expect.stringContaining(MOCK_TWILIO_WEBHOOK_ROUTE),
  //       })

  //       expect(twilioSuccessSpy.mock.calls[0][0].statusCallback).toEqual(
  //         expect.not.stringContaining('?senderIp'),
  //       )

  //       expect(smsCountSpy).toHaveBeenCalledWith({
  //         smsData: {
  //           form: MOCK_FORM_ID,
  //           collaboratorEmail: MOCK_RECIPIENT_EMAIL,
  //           recipientNumber: TWILIO_TEST_NUMBER,
  //           formAdmin: {
  //             email: MOCK_ADMIN_EMAIL,
  //             userId: MOCK_ADMIN_ID,
  //           },
  //         },
  //         smsType: SmsType.BouncedSubmission,
  //         msgSrvcSid: MOCK_VALID_CONFIG.msgSrvcSid,
  //         logType: LogType.success,
  //       })
  //     })

  //     it('should log failure when sending fails', async () => {
  //       // Arrange
  //       const expectedMessage = renderBouncedSubmissionSms(MOCK_FORM_TITLE)

  //       // Act
  //       const actualResult = await SmsService.sendBouncedSubmissionSms(
  //         {
  //           recipient: TWILIO_TEST_NUMBER,
  //           adminEmail: MOCK_ADMIN_EMAIL,
  //           adminId: MOCK_ADMIN_ID,
  //           formId: MOCK_FORM_ID,
  //           formTitle: MOCK_FORM_TITLE,
  //           recipientEmail: MOCK_RECIPIENT_EMAIL,
  //         },
  //         MOCK_INVALID_CONFIG,
  //       )

  //       // Assert
  //       expect(actualResult._unsafeUnwrapErr()).toEqual(new InvalidNumberError())
  //       expect(twilioFailureSpy).toHaveBeenCalledWith({
  //         to: TWILIO_TEST_NUMBER,
  //         body: expectedMessage,
  //         from: MOCK_INVALID_CONFIG.msgSrvcSid,
  //         forceDelivery: true,
  //         statusCallback: expect.stringContaining(MOCK_TWILIO_WEBHOOK_ROUTE),
  //       })
  //       expect(smsCountSpy).toHaveBeenCalledWith({
  //         smsData: {
  //           form: MOCK_FORM_ID,
  //           collaboratorEmail: MOCK_RECIPIENT_EMAIL,
  //           recipientNumber: TWILIO_TEST_NUMBER,
  //           formAdmin: {
  //             email: MOCK_ADMIN_EMAIL,
  //             userId: MOCK_ADMIN_ID,
  //           },
  //         },
  //         smsType: SmsType.BouncedSubmission,
  //         msgSrvcSid: MOCK_INVALID_CONFIG.msgSrvcSid,
  //         logType: LogType.failure,
  //       })
  //     })
  //   })

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
      const postmanSendSpy = jest
        .spyOn(PostmanSmsService, 'sendMopSms')
        .mockResolvedValueOnce(okAsync(true))

      // Act
      const actualResult = await PostmanSmsService.sendVerificationOtp(
        TEST_NUMBER,
        '111111',
        'ABC',
        testForm._id,
        MOCK_SENDER_IP,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MalformedParametersError(
          `Unable to retrieve otpData from ${testForm._id}`,
        ),
      )
      expect(postmanSendSpy).not.toHaveBeenCalled()
    })

    it('should log and send verification OTP through MOP channel when sending has no errors', async () => {
      // Arrange
      jest.spyOn(FormModel, 'getOtpData').mockResolvedValueOnce(mockOtpData)

      const postmanSendSpy = jest
        .spyOn(PostmanSmsService, 'sendMopSms')
        .mockResolvedValueOnce(okAsync(true))

      // Act
      const actualResult = await PostmanSmsService.sendVerificationOtp(
        TEST_NUMBER,
        '111111',
        'ABC',
        testForm._id,
        MOCK_SENDER_IP,
      )

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      expect(postmanSendSpy).toHaveBeenCalledOnce()
    })

    it('should return InvalidNumberError when verification OTP fails to send due to invalid number', async () => {
      // Arrange
      jest.spyOn(FormModel, 'getOtpData').mockResolvedValueOnce(mockOtpData)
      const postmanSendSpy = jest
        .spyOn(PostmanSmsService, 'sendMopSms')
        .mockResolvedValueOnce(okAsync(true))

      const invalidNumber = '1+11123'
      // Act
      const actualResult = await PostmanSmsService.sendVerificationOtp(
        invalidNumber,
        '111111',
        'ABC',
        testForm._id,
        MOCK_SENDER_IP,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(new InvalidNumberError())
      expect(postmanSendSpy).not.toHaveBeenCalled()
    })
  })

  //   describe('sendAdminContactOtp', () => {
  //     it('should log and send contact OTP when sending has no errors', async () => {
  //       // Act
  //       const actualResult = await SmsService.sendAdminContactOtp(
  //         /* recipient= */ TWILIO_TEST_NUMBER,
  //         /* otp= */ '111111',
  //         /* userId= */ testUser._id,
  //         /* senderIp= */ MOCK_SENDER_IP,
  //         /* defaultConfig= */ MOCK_VALID_CONFIG,
  //       )

  //       // Assert
  //       expect(twilioSuccessSpy.mock.calls[0][0].statusCallback).toEqual(
  //         expect.stringContaining('?senderIp'),
  //       )

  //       // Should resolve to true
  //       expect(actualResult.isOk()).toEqual(true)
  //       expect(actualResult._unsafeUnwrap()).toEqual(true)
  //       // Logging should also have happened.
  //       const expectedLogParams = {
  //         smsData: {
  //           admin: testUser._id,
  //         },
  //         msgSrvcSid: MOCK_MSG_SRVC_SID,
  //         smsType: SmsType.AdminContact,
  //         logType: LogType.success,
  //       }
  //       expect(smsCountSpy).toHaveBeenCalledWith(expectedLogParams)
  //     })
  //   })

  //   describe('retrieveFreeSmsCounts', () => {
  //     const VERIFICATION_SMS_COUNT = 3

  //     it('should retrieve sms counts correctly for a specified user', async () => {
  //       // Arrange
  //       const retrieveSpy = jest.spyOn(SmsCountModel, 'retrieveFreeSmsCounts')
  //       retrieveSpy.mockResolvedValueOnce(VERIFICATION_SMS_COUNT)

  //       // Act
  //       const actual = await SmsService.retrieveFreeSmsCounts(testUser._id)

  //       // Assert
  //       expect(actual._unsafeUnwrap()).toBe(VERIFICATION_SMS_COUNT)
  //     })

  //     it('should return a database error when retrieval fails', async () => {
  //       // Arrange
  //       const retrieveSpy = jest.spyOn(SmsCountModel, 'retrieveFreeSmsCounts')
  //       retrieveSpy.mockRejectedValueOnce('ohno')

  //       // Act
  //       const actual = await SmsService.retrieveFreeSmsCounts(testUser._id)

  //       // Assert
  //       expect(actual._unsafeUnwrapErr()).toEqual(
  //         new DatabaseError(getMongoErrorMessage('ohno')),
  //       )
  //     })
  //   })

  //   it('should log failure and throw error when contact OTP fails to send', async () => {
  //     // Act
  //     const actualResult = await SmsService.sendAdminContactOtp(
  //       /* recipient= */ TWILIO_TEST_NUMBER,
  //       /* otp= */ '111111',
  //       /* userId= */ testUser._id,
  //       /* senderIp= */ MOCK_SENDER_IP,
  //       /* defaultConfig= */ MOCK_INVALID_CONFIG,
  //     )

  //     // Assert
  //     const expectedError = new Error(VfnErrors.InvalidMobileNumber)
  //     expectedError.name = VfnErrors.SendOtpFailed

  //     expect(actualResult.isErr()).toEqual(true)

  //     // Logging should also have happened.
  //     const expectedLogParams = {
  //       smsData: {
  //         admin: testUser._id,
  //       },
  //       msgSrvcSid: MOCK_MSG_SRVC_SID,
  //       smsType: SmsType.AdminContact,
  //       logType: LogType.failure,
  //     }
  //     expect(smsCountSpy).toHaveBeenCalledWith(expectedLogParams)
  //   })
})
