import { ObjectId } from 'bson'
import { okAsync } from 'neverthrow'
import Twilio from 'twilio'

import { ISms } from 'src/app/config/features/sms.config'

import { createSmsFactory } from '../sms.factory'
import * as SmsService from '../sms.service'
import { BounceNotificationSmsParams, TwilioConfig } from '../sms.types'

// This is hoisted and thus a const cannot be passed in.
jest.mock('twilio', () =>
  jest.fn().mockImplementation(() => ({
    mocked: 'this is mocked',
  })),
)

jest.mock('../sms.service')
const MockSmsService = jest.mocked(SmsService)

const MOCKED_TWILIO = {
  mocked: 'this is mocked',
} as unknown as Twilio.Twilio

const MOCK_BOUNCE_SMS_PARAMS: BounceNotificationSmsParams = {
  adminEmail: 'admin@email.com',
  adminId: new ObjectId().toHexString(),
  formId: new ObjectId().toHexString(),
  formTitle: 'mock form title',
  recipient: '+6581234567',
  recipientEmail: 'recipient@email.com',
}

describe('sms.factory', () => {
  beforeEach(() => jest.clearAllMocks())

  const MOCK_SMS_FEATURE: ISms = {
    twilioAccountSid: 'ACrandomTwilioSid',
    twilioApiKey: 'SKrandomTwilioAPIKEY',
    twilioApiSecret: 'this is a super secret',
    twilioMsgSrvcSid: 'formsg-is-great-pleasehelpme',
    smsVerificationLimit: 10000,
  }
  const expectedTwilioConfig: TwilioConfig = {
    msgSrvcSid: MOCK_SMS_FEATURE.twilioMsgSrvcSid,
    client: MOCKED_TWILIO,
  }
  const SmsFactory = createSmsFactory(MOCK_SMS_FEATURE)

  it('should call SmsService counterpart when invoking sendAdminContactOtp', async () => {
    // Arrange
    MockSmsService.sendAdminContactOtp.mockReturnValueOnce(okAsync(true))

    const mockArguments: Parameters<typeof SmsFactory.sendAdminContactOtp> = [
      'mockRecipient',
      'mockOtp',
      'mockFormId',
      'mockSenderIp',
    ]

    // Act
    await SmsFactory.sendAdminContactOtp(...mockArguments)

    // Assert
    expect(MockSmsService.sendAdminContactOtp).toHaveBeenCalledTimes(1)
    expect(MockSmsService.sendAdminContactOtp).toHaveBeenCalledWith(
      ...mockArguments,
      expectedTwilioConfig,
    )
  })

  it('should call SmsService counterpart when invoking sendVerificationOtp', async () => {
    // Arrange
    MockSmsService.sendVerificationOtp.mockReturnValue(okAsync(true))

    const mockArguments: Parameters<typeof SmsFactory.sendAdminContactOtp> = [
      'mockRecipient',
      'mockOtp',
      'mockUserId',
      'mockSenderIp',
    ]

    // Act
    await SmsFactory.sendVerificationOtp(...mockArguments)

    // Assert
    expect(MockSmsService.sendVerificationOtp).toHaveBeenCalledTimes(1)
    expect(MockSmsService.sendVerificationOtp).toHaveBeenCalledWith(
      ...mockArguments,
      expectedTwilioConfig,
    )
  })

  it('should call SmsService when sendFormDeactivatedSms is called', async () => {
    MockSmsService.sendFormDeactivatedSms.mockReturnValue(okAsync(true))

    await SmsFactory.sendFormDeactivatedSms(MOCK_BOUNCE_SMS_PARAMS)

    expect(MockSmsService.sendFormDeactivatedSms).toHaveBeenCalledWith(
      MOCK_BOUNCE_SMS_PARAMS,
      expectedTwilioConfig,
    )
  })

  it('should call SmsService when sendBouncedSubmissionSms is called', async () => {
    MockSmsService.sendBouncedSubmissionSms.mockReturnValue(okAsync(true))

    await SmsFactory.sendBouncedSubmissionSms(MOCK_BOUNCE_SMS_PARAMS)

    expect(MockSmsService.sendBouncedSubmissionSms).toHaveBeenCalledWith(
      MOCK_BOUNCE_SMS_PARAMS,
      expectedTwilioConfig,
    )
  })
})
