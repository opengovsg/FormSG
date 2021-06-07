import { ObjectId } from 'bson'
import { okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'
import Twilio from 'twilio'

import {
  FeatureNames,
  ISms,
  RegisteredFeature,
} from 'src/app/config/feature-manager'
import { MissingFeatureError } from 'src/app/modules/core/core.errors'

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
const MockSmsService = mocked(SmsService, true)

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

  describe('sms feature disabled', () => {
    const MOCK_DISABLED_SMS_FEATURE: RegisteredFeature<FeatureNames.Sms> = {
      isEnabled: false,
      props: {} as ISms,
    }

    const SmsFactory = createSmsFactory(MOCK_DISABLED_SMS_FEATURE)

    it('should return MissingFeatureError when invoking sendAdminContactOtp', async () => {
      // Act
      const result = await SmsFactory.sendAdminContactOtp(
        'anything',
        'anything',
        'anything',
      )

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(
        new MissingFeatureError(FeatureNames.Sms),
      )
    })

    it('should return MissingFeatureError when invoking sendVerificationOtp', async () => {
      // Act
      const result = await SmsFactory.sendVerificationOtp(
        'anything',
        'anything',
        'anything',
      )

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(
        new MissingFeatureError(FeatureNames.Sms),
      )
    })

    it('should return MissingFeatureError when invoking sendFormDeactivatedSms', async () => {
      // Act
      const result = await SmsFactory.sendFormDeactivatedSms(
        MOCK_BOUNCE_SMS_PARAMS,
      )

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(
        new MissingFeatureError(FeatureNames.Sms),
      )
    })

    it('should return MissingFeatureError when invoking sendBouncedSubmissionSms', async () => {
      // Act
      const result = await SmsFactory.sendBouncedSubmissionSms(
        MOCK_BOUNCE_SMS_PARAMS,
      )

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(
        new MissingFeatureError(FeatureNames.Sms),
      )
    })
  })

  describe('sms feature enabled', () => {
    const MOCK_ENABLED_SMS_FEATURE: Required<
      RegisteredFeature<FeatureNames.Sms>
    > = {
      isEnabled: true,
      props: {
        twilioAccountSid: 'ACrandomTwilioSid',
        twilioApiKey: 'SKrandomTwilioAPIKEY',
        twilioApiSecret: 'this is a super secret',
        twilioMsgSrvcSid: 'formsg-is-great-pleasehelpme',
      },
    }
    const expectedTwilioConfig: TwilioConfig = {
      msgSrvcSid: MOCK_ENABLED_SMS_FEATURE.props.twilioMsgSrvcSid,
      client: MOCKED_TWILIO,
    }
    const SmsFactory = createSmsFactory(MOCK_ENABLED_SMS_FEATURE)

    it('should call SmsService counterpart when invoking sendAdminContactOtp', async () => {
      // Arrange
      MockSmsService.sendAdminContactOtp.mockReturnValueOnce(okAsync(true))

      const mockArguments: Parameters<typeof SmsFactory.sendAdminContactOtp> = [
        'mockRecipient',
        'mockOtp',
        'mockFormId',
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
      MockSmsService.sendVerificationOtp.mockResolvedValue(true)

      const mockArguments: Parameters<typeof SmsFactory.sendAdminContactOtp> = [
        'mockRecipient',
        'mockOtp',
        'mockUserId',
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
      MockSmsService.sendFormDeactivatedSms.mockResolvedValueOnce(true)

      await SmsFactory.sendFormDeactivatedSms(MOCK_BOUNCE_SMS_PARAMS)

      expect(MockSmsService.sendFormDeactivatedSms).toHaveBeenCalledWith(
        MOCK_BOUNCE_SMS_PARAMS,
        expectedTwilioConfig,
      )
    })

    it('should call SmsService when sendBouncedSubmissionSms is called', async () => {
      MockSmsService.sendBouncedSubmissionSms.mockResolvedValueOnce(true)

      await SmsFactory.sendBouncedSubmissionSms(MOCK_BOUNCE_SMS_PARAMS)

      expect(MockSmsService.sendBouncedSubmissionSms).toHaveBeenCalledWith(
        MOCK_BOUNCE_SMS_PARAMS,
        expectedTwilioConfig,
      )
    })
  })
})
