import { okAsync } from 'neverthrow'
import Twilio from 'twilio'

import { ISms } from 'src/app/config/features/sms.config'

import { createSmsFactory } from '../sms.factory'
import * as SmsService from '../sms.service'
import { TwilioConfig } from '../sms.types'

// This is hoisted and thus a const cannot be passed in.
jest.mock('twilio', () =>
  jest.fn().mockImplementation(() => ({
    mocked: 'this is mocked',
  })),
)

jest.mock('src/app/services/sms/sms.dev.prismclient', () => () => ({}))

jest.mock('../sms.service')
const MockSmsService = jest.mocked(SmsService)

const MOCKED_TWILIO = {
  mocked: 'this is mocked',
} as unknown as Twilio.Twilio

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

  it('should call SmsService counterpart when invoking sendVerificationOtp', async () => {
    // Arrange
    MockSmsService.sendVerificationOtp.mockReturnValue(okAsync(true))

    const mockArguments: Parameters<typeof SmsFactory.sendVerificationOtp> = [
      'mockRecipient',
      'mockOtp',
      'mockOtpPrefix',
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
})
