const dbHandler = require('../helpers/db-handler')
const { VfnErrors } = spec('dist/backend/shared/util/verification')
const { SmsType, LogType } = spec('dist/backend/types')

const Form = dbHandler.makeModel('form.server.model', 'Form')
const SmsCount = dbHandler.makeModel('sms_count.server.model', 'SmsCount')

const SmsService = spec('dist/backend/app/services/sms.service')

// Test numbers provided by Twilio:
// https://www.twilio.com/docs/iam/test-credentials
const TWILIO_TEST_NUMBER = '+15005550006'

const MOCK_MSG_SRVC_SID = 'mockMsgSrvcSid'

describe('sms.service', () => {
  const MOCK_VALID_CONFIG = {
    msgSrvcSid: MOCK_MSG_SRVC_SID,
    client: {
      messages: {
        create: jasmine.createSpy().and.resolveTo({
          status: 'testStatus',
          sid: 'testSid',
        }),
      },
    },
  }

  const MOCK_INVALID_CONFIG = {
    msgSrvcSid: MOCK_MSG_SRVC_SID,
    client: {
      messages: {
        create: jasmine.createSpy().and.resolveTo({
          status: 'testStatus',
          sid: undefined,
          errorCode: 21211,
        }),
      },
    },
  }

  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('sendVerificationOtp', () => {
    let testForm
    let mockOtpData
    beforeEach(async () => {
      const { form, user } = await dbHandler.preloadCollections()

      mockOtpData = {
        form: form._id,
        formAdmin: {
          email: user.email,
          userId: user._id,
        },
      }

      testForm = form
    })
    it('should throw error if otpData is null', async () => {
      // Arrange
      // Return null on Form method
      spyOn(Form, 'getOtpData').and.returnValue(null)

      await expectAsync(
        SmsService.sendVerificationOtp(
          /* recipient= */ TWILIO_TEST_NUMBER,
          /* otp= */ '111111',
          /* formId= */ testForm._id,
          /* defaultConfig= */ MOCK_VALID_CONFIG,
        ),
      ).toBeRejectedWithError()
    })

    it('should log and send verification OTP if twilio has no errors', async () => {
      // Arrange
      spyOn(Form, 'getOtpData').and.returnValue(mockOtpData)
      const smsCountSpy = spyOn(SmsCount, 'logSms').and.callThrough()
      // Act + Assert
      await expectAsync(
        SmsService.sendVerificationOtp(
          /* recipient= */ TWILIO_TEST_NUMBER,
          /* otp= */ '111111',
          /* formId= */ testForm._id,
          /* defaultConfig= */ MOCK_VALID_CONFIG,
        ),
        // Should resolve to true
      ).toBeResolvedTo(true)

      // Logging should also have happened.
      const expectedLogParams = {
        otpData: mockOtpData,
        msgSrvcSid: MOCK_MSG_SRVC_SID,
        smsType: SmsType.verification,
        logType: LogType.success,
      }
      expect(smsCountSpy).toHaveBeenCalledWith(expectedLogParams)
    })

    it('should log failure and throw error if twilio failed to send', async () => {
      // Arrange
      spyOn(Form, 'getOtpData').and.returnValue(mockOtpData)
      const smsCountSpy = spyOn(SmsCount, 'logSms').and.callThrough()

      // Act + Assert
      const expectedError = new Error(VfnErrors.InvalidMobileNumber)
      expectedError.name = VfnErrors.SendOtpFailed

      await expectAsync(
        SmsService.sendVerificationOtp(
          /* recipient= */ TWILIO_TEST_NUMBER,
          /* otp= */ '111111',
          /* formId= */ testForm._id,
          /* defaultConfig= */ MOCK_INVALID_CONFIG,
        ),
      ).toBeRejectedWith(expectedError)

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
})
